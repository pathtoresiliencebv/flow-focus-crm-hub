import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { languageDetectionService } from '@/services/languageDetectionService';

export const useLanguageDetection = () => {
  const { user } = useAuth();
  const [userLanguage, setUserLanguage] = useState<string>('nl');
  const [browserLanguage, setBrowserLanguage] = useState<string>('nl');
  const [loading, setLoading] = useState(true);

  // Detect browser language on mount
  useEffect(() => {
    const detected = languageDetectionService.detectBrowserLanguage();
    setBrowserLanguage(detected);
  }, []);

  // Load user's preferred language
  useEffect(() => {
    const loadUserLanguage = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        const preferred = await languageDetectionService.getUserLanguagePreference(user.id);
        setUserLanguage(preferred);
      } catch (error) {
        console.error('Error loading user language:', error);
        // Fallback to browser language
        setUserLanguage(browserLanguage);
      } finally {
        setLoading(false);
      }
    };

    loadUserLanguage();
  }, [user?.id, browserLanguage]);

  const updateUserLanguage = useCallback(async (language: string) => {
    if (!user?.id) return;

    try {
      await languageDetectionService.setUserLanguagePreference(user.id, language);
      setUserLanguage(language);
    } catch (error) {
      console.error('Error updating user language:', error);
      throw error;
    }
  }, [user?.id]);

  const detectOptimalLanguage = useCallback(async (content?: string) => {
    if (!user?.id) return userLanguage;

    try {
      return await languageDetectionService.getOptimalLanguage(user.id, content);
    } catch (error) {
      console.error('Error detecting optimal language:', error);
      return userLanguage;
    }
  }, [user?.id, userLanguage]);

  const detectContentLanguage = useCallback((text: string) => {
    return languageDetectionService.detectFromContent(text);
  }, []);

  const getLanguageName = useCallback((code: string) => {
    return languageDetectionService.getLanguageName(code);
  }, []);

  const supportedLanguages = [
    { code: 'nl', name: 'Nederlands' },
    { code: 'pl', name: 'Polski' },
    { code: 'cs', name: 'Čeština' },
    { code: 'de', name: 'Deutsch' },
    { code: 'en', name: 'English' }
  ];

  return {
    userLanguage,
    browserLanguage,
    loading,
    supportedLanguages,
    updateUserLanguage,
    detectOptimalLanguage,
    detectContentLanguage,
    getLanguageName
  };
};