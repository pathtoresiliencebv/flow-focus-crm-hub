/**
 * I18n Context Provider
 * 
 * Provides platform-wide translation functionality based on user's language preference.
 * Automatically detects user language and loads appropriate translations.
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { i18n, Language } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';

interface I18nContextType {
  t: (key: string, fallback?: string, variables?: Record<string, string>) => string;
  language: Language;
  setLanguage: (language: Language) => Promise<void>;
  isLoading: boolean;
  translateToNL: (text: string, sourceLanguage?: Language) => Promise<string>;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('nl');
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [, forceUpdate] = useState(0);

  // Subscribe to language changes from i18n service
  useEffect(() => {
    const unsubscribe = i18n.subscribe(() => {
      console.log('🔄 I18nContext: Language changed, forcing re-render');
      setLanguageState(i18n.getLanguage());
      forceUpdate(prev => prev + 1); // Force re-render all components using useI18n
    });

    return unsubscribe;
  }, []);

  // Initialize i18n when user logs in
  useEffect(() => {
    const initializeI18n = async () => {
      try {
        setIsLoading(true);
        
        // Get current session
        const { data: { session } } = await supabase.auth.getSession();
        const currentUserId = session?.user?.id || null;
        setUserId(currentUserId);

        if (currentUserId) {
          await i18n.initialize(currentUserId);
          setLanguageState(i18n.getLanguage());
        }
      } catch (error) {
        console.error('Failed to initialize i18n:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeI18n();

    // Listen to auth state changes - only for SIGNED_IN and SIGNED_OUT
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // ✅ Stricter: Skip initial session to prevent duplicate initialization
      if (event === 'INITIAL_SESSION') return;
      
      const newUserId = session?.user?.id || null;
      
      // ✅ Skip if same user - prevents re-initialization on refresh/tab switch
      if (newUserId === userId) return;
      
      setUserId(newUserId);
      
      if (newUserId) {
        await i18n.initialize(newUserId);
        setLanguageState(i18n.getLanguage());
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Subscribe to language preference changes
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('user_language_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_language_preferences',
          filter: `user_id=eq.${userId}`
        },
        async (payload) => {
          if (payload.new.ui_language !== language) {
            await i18n.setLanguage(payload.new.ui_language as Language);
            setLanguageState(payload.new.ui_language as Language);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, language]);

  const handleSetLanguage = async (newLanguage: Language) => {
    try {
      setIsLoading(true);
      await i18n.setLanguage(newLanguage, userId || undefined);
      setLanguageState(newLanguage);
    } catch (error) {
      console.error('Failed to change language:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const t = (key: string, fallback?: string, variables?: Record<string, string>): string => {
    return i18n.t(key, fallback, variables);
  };

  const translateToNL = async (text: string, sourceLanguage?: Language): Promise<string> => {
    return await i18n.translateToNL(text, sourceLanguage);
  };

  const value: I18nContextType = {
    t,
    language,
    setLanguage: handleSetLanguage,
    isLoading,
    translateToNL
  };

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextType {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}

// Helper component for translated text
export function T({ k, fallback, vars }: { 
  k: string; 
  fallback?: string; 
  vars?: Record<string, string>;
}) {
  const { t } = useI18n();
  return <>{t(k, fallback, vars)}</>;
}

