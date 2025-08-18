import { useState, useEffect } from 'react';

export interface TranslationResult {
  translatedText: string;
  confidence: number;
  error?: string;
  cached?: boolean;
}

interface LanguageData {
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

interface UserPreferences {
  preferred_language: string;
  ui_language: string;
  chat_translation_enabled: boolean;
  auto_detect_language: boolean;
}

// Mock translation function for now
export const useTranslation = () => {
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({
    preferred_language: 'nl',
    ui_language: 'nl',
    chat_translation_enabled: false,
    auto_detect_language: true,
  });

  const [loading, setLoading] = useState(false);

  const supportedLanguages: LanguageData[] = [
    {
      language_code: 'nl',
      language_name: 'Dutch',
      native_name: 'Nederlands',
      flag_emoji: '🇳🇱',
      ui_supported: true,
    },
    {
      language_code: 'en',
      language_name: 'English',
      native_name: 'English',
      flag_emoji: '🇺🇸',
      ui_supported: true,
    },
    {
      language_code: 'de',
      language_name: 'German',
      native_name: 'Deutsch',
      flag_emoji: '🇩🇪',
      ui_supported: false,
    },
  ];

  const updateUserPreferences = async (updates: Partial<UserPreferences>) => {
    setUserPreferences(prev => ({ ...prev, ...updates }));
  };

  const translateMessage = async (
    text: string,
    targetLanguage: string,
    messageId?: string,
    sourceLanguage?: string
  ): Promise<TranslationResult> => {
    // Mock translation - in real app this would call the API
    return {
      translatedText: `[Translated]: ${text}`,
      confidence: 0.9,
      cached: false,
    };
  };

  const getLanguageFlag = (languageCode: string): string => {
    const language = supportedLanguages.find(lang => lang.language_code === languageCode);
    return language?.flag_emoji || '🏳️';
  };

  const getLanguageName = (languageCode: string): string => {
    const language = supportedLanguages.find(lang => lang.language_code === languageCode);
    return language?.native_name || languageCode;
  };

  // Simple translation function for UI text
  const t = (key: string, fallback?: string): string => {
    // Mock implementation - in real app this would look up translations
    return fallback || key;
  };

  return {
    userPreferences,
    supportedLanguages,
    loading,
    updateUserPreferences,
    translateMessage,
    getLanguageFlag,
    getLanguageName,
    t,
  };
};