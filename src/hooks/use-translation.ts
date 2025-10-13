import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface TranslationResult {
  translatedText: string;
  detectedLanguage: string;
  confidence: number;
}

export const useTranslation = () => {
  const [isTranslating, setIsTranslating] = useState(false);
  const { user } = useAuth();

  // Get user's preferred language from database
  const getUserLanguage = useCallback(async (): Promise<string> => {
    if (!user?.id) return 'nl'; // Default to Dutch

    try {
      const { data, error } = await supabase
        .from('user_language_preferences')
        .select('ui_language')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.warn('No user language preference found, using default: nl');
        return 'nl';
      }

      return data?.ui_language || 'nl';
    } catch (error) {
      console.error('Error loading user language:', error);
      return 'nl';
    }
  }, [user?.id]);

  const translateText = useCallback(async (
    text: string, 
    targetLanguage?: string
  ): Promise<string> => {
    if (!text.trim()) return text;

    setIsTranslating(true);
    
    try {
      // Get user's preferred language if not specified
      const userLanguage = targetLanguage || await getUserLanguage();
      
      // Always translate to user's language, regardless of source language
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          targetLanguage: userLanguage,
        }),
      });

      if (!response.ok) {
        throw new Error('Translation failed');
      }

      const data = await response.json();
      return data.translatedText;
    } catch (error) {
      console.error('Translation error:', error);
      // Fallback: return original text
      return text;
    } finally {
      setIsTranslating(false);
    }
  }, [getUserLanguage]);

  const detectLanguage = useCallback(async (text: string): Promise<string> => {
    if (!text.trim()) return 'unknown';

    try {
      const response = await fetch('/api/detect-language', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error('Language detection failed');
      }

      const data = await response.json();
      return data.language;
    } catch (error) {
      console.error('Language detection error:', error);
      return 'unknown';
    }
  }, []);

  return {
    translateText,
    detectLanguage,
    getUserLanguage,
    isTranslating,
  };
};
