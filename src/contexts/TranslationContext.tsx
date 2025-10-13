import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation as useTranslationHook } from '@/hooks/useTranslation';

interface TranslationContextType {
  t: (key: string, fallback?: string) => string;
  userLanguage: string;
  uiLanguage: string;
  translationEnabled: boolean;
  changeLanguage: (language: string) => Promise<void>;
  changeUILanguage: (language: string) => Promise<void>;
  toggleTranslation: (enabled: boolean) => Promise<void>;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export const TranslationProvider = ({ children }: { children: ReactNode }) => {
  const {
    t,
    userPreferences,
    updateUserPreferences,
    loading,
  } = useTranslationHook();

  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!loading) {
      setIsReady(true);
    }
  }, [loading]);

  const changeLanguage = async (language: string) => {
    await updateUserPreferences({ preferred_language: language });
  };

  const changeUILanguage = async (language: string) => {
    await updateUserPreferences({ ui_language: language });
  };

  const toggleTranslation = async (enabled: boolean) => {
    await updateUserPreferences({ chat_translation_enabled: enabled });
  };

  const contextValue: TranslationContextType = {
    t,
    userLanguage: userPreferences.preferred_language,
    uiLanguage: userPreferences.ui_language,
    translationEnabled: userPreferences.chat_translation_enabled,
    changeLanguage,
    changeUILanguage,
    toggleTranslation,
  };

  // ✅ Optimistic rendering: only show loading on FIRST load (no preferences yet)
  // On refresh, render immediately with cached/default values
  if (loading && !userPreferences.ui_language) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // ✅ Show content immediately, even while loading (after first load)
  return (
    <TranslationContext.Provider value={contextValue}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslationContext = () => {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error('useTranslationContext must be used within a TranslationProvider');
  }
  return context;
};