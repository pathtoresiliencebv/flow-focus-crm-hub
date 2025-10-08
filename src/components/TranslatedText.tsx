import { useEffect, useState } from 'react';
import { i18n } from '@/lib/i18n';

interface TranslatedTextProps {
  children: string;
  variables?: Record<string, string>;
}

/**
 * Component that automatically translates text based on user's language
 * Usage: <TranslatedText>Dashboard</TranslatedText>
 */
export function TranslatedText({ children, variables }: TranslatedTextProps) {
  const [translated, setTranslated] = useState(children);
  const currentLang = i18n.getLanguage();

  useEffect(() => {
    // Skip if Dutch (source language)
    if (currentLang === 'nl') {
      setTranslated(children);
      return;
    }

    // Get translation
    const translation = i18n.t(children, children, variables);
    setTranslated(translation);

    // Re-check after a short delay in case translation was fetched
    const timeout = setTimeout(() => {
      const updatedTranslation = i18n.t(children, children, variables);
      if (updatedTranslation !== translation) {
        setTranslated(updatedTranslation);
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [children, currentLang, variables]);

  return <>{translated}</>;
}

/**
 * Hook for translating text in components
 */
export function useTranslate() {
  const [, forceUpdate] = useState({});

  return {
    t: (key: string, fallback?: string, variables?: Record<string, string>) => {
      const translation = i18n.t(key, fallback, variables);
      
      // Force re-render after a delay if translation might have been fetched
      if (translation === key && i18n.getLanguage() !== 'nl') {
        setTimeout(() => forceUpdate({}), 500);
      }
      
      return translation;
    },
    language: i18n.getLanguage(),
  };
}

