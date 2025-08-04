import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface SupportedLanguage {
  language_code: string;
  language_name: string;
  native_name: string;
  flag_emoji: string;
  ui_supported: boolean;
}

export interface UserLanguagePreferences {
  preferred_language: string;
  ui_language: string;
  chat_translation_enabled: boolean;
  auto_detect_language: boolean;
}

export interface TranslationResult {
  translatedText: string;
  originalText: string;
  fromLanguage: string;
  toLanguage: string;
  confidence: number;
  cached?: boolean;
  skipped?: boolean;
  error?: string;
}

export const useTranslation = () => {
  const { user } = useAuth();
  const [supportedLanguages, setSupportedLanguages] = useState<SupportedLanguage[]>([]);
  const [userPreferences, setUserPreferences] = useState<UserLanguagePreferences>({
    preferred_language: 'nl',
    ui_language: 'nl',
    chat_translation_enabled: true,
    auto_detect_language: true,
  });
  const [uiTranslations, setUiTranslations] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  // Load supported languages
  useEffect(() => {
    loadSupportedLanguages();
  }, []);

  // Load user preferences and UI translations when user changes
  useEffect(() => {
    if (user?.id) {
      loadUserPreferences();
      loadUITranslations();
    }
  }, [user?.id]);

  const loadSupportedLanguages = async () => {
    try {
      const { data, error } = await supabase
        .from('supported_languages')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      setSupportedLanguages(data || []);
    } catch (error) {
      console.error('Error loading supported languages:', error);
    }
  };

  const loadUserPreferences = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('user_language_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setUserPreferences({
          preferred_language: data.preferred_language,
          ui_language: data.ui_language,
          chat_translation_enabled: data.chat_translation_enabled,
          auto_detect_language: data.auto_detect_language,
        });
      } else {
        // Create default preferences
        await createDefaultPreferences();
      }
    } catch (error) {
      console.error('Error loading user preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const createDefaultPreferences = async () => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('user_language_preferences')
        .insert({
          user_id: user.id,
          preferred_language: 'nl',
          ui_language: 'nl',
          chat_translation_enabled: true,
          auto_detect_language: true,
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error creating default preferences:', error);
    }
  };

  const loadUITranslations = async () => {
    try {
      const { data, error } = await supabase
        .from('ui_translations')
        .select('translation_key, translated_text')
        .eq('language_code', userPreferences.ui_language);

      if (error) throw error;

      const translations: Record<string, string> = {};
      data?.forEach(item => {
        translations[item.translation_key] = item.translated_text;
      });

      setUiTranslations(translations);
    } catch (error) {
      console.error('Error loading UI translations:', error);
    }
  };

  const updateUserPreferences = async (preferences: Partial<UserLanguagePreferences>) => {
    if (!user?.id) return;

    try {
      const updatedPreferences = { ...userPreferences, ...preferences };

      const { error } = await supabase
        .from('user_language_preferences')
        .update({
          preferred_language: updatedPreferences.preferred_language,
          ui_language: updatedPreferences.ui_language,
          chat_translation_enabled: updatedPreferences.chat_translation_enabled,
          auto_detect_language: updatedPreferences.auto_detect_language,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      setUserPreferences(updatedPreferences);

      // Reload UI translations if language changed
      if (preferences.ui_language && preferences.ui_language !== userPreferences.ui_language) {
        await loadUITranslations();
      }
    } catch (error) {
      console.error('Error updating user preferences:', error);
      throw error;
    }
  };

  const translateMessage = useCallback(async (
    text: string,
    toLanguage?: string,
    messageId?: string,
    fromLanguage?: string
  ): Promise<TranslationResult> => {
    const targetLanguage = toLanguage || userPreferences.preferred_language;

    try {
      const response = await supabase.functions.invoke('translate-message', {
        body: {
          text,
          fromLanguage,
          toLanguage: targetLanguage,
          messageId,
        },
      });

      if (response.error) throw response.error;

      return response.data as TranslationResult;
    } catch (error) {
      console.error('Translation error:', error);
      return {
        translatedText: text,
        originalText: text,
        fromLanguage: fromLanguage || 'unknown',
        toLanguage: targetLanguage,
        confidence: 0,
        error: error instanceof Error ? error.message : 'Translation failed',
      };
    }
  }, [userPreferences.preferred_language]);

  const getTranslation = (key: string, fallback?: string): string => {
    return uiTranslations[key] || fallback || key;
  };

  const t = getTranslation;

  const getLanguageName = (languageCode: string): string => {
    const language = supportedLanguages.find(lang => lang.language_code === languageCode);
    return language ? language.native_name : languageCode;
  };

  const getLanguageFlag = (languageCode: string): string => {
    const language = supportedLanguages.find(lang => lang.language_code === languageCode);
    return language ? language.flag_emoji : '🌍';
  };

  return {
    // State
    supportedLanguages,
    userPreferences,
    uiTranslations,
    loading,

    // Actions
    updateUserPreferences,
    translateMessage,
    loadUITranslations,

    // Helpers
    getTranslation,
    t,
    getLanguageName,
    getLanguageFlag,
  };
};