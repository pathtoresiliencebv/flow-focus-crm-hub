import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from './use-translation';
import { useAuth } from '@/contexts/AuthContext';

interface TranslatedMessage {
  originalText: string;
  translatedText: string;
  userLanguage: string;
}

export const useAutoTranslate = () => {
  const { translateText, getUserLanguage } = useTranslation();
  const { user } = useAuth();
  const [translatedMessages, setTranslatedMessages] = useState<Map<string, TranslatedMessage>>(new Map());

  // Auto-translate incoming messages
  const autoTranslateMessage = useCallback(async (
    messageId: string,
    originalText: string,
    senderLanguage?: string
  ): Promise<string> => {
    if (!originalText.trim()) return originalText;

    try {
      // Get current user's language
      const userLanguage = await getUserLanguage();
      
      // If message is already in user's language, no need to translate
      if (senderLanguage === userLanguage) {
        return originalText;
      }

      // Check if we already have this translation cached
      const cached = translatedMessages.get(messageId);
      if (cached && cached.originalText === originalText) {
        return cached.translatedText;
      }

      // Translate the message
      const translatedText = await translateText(originalText, userLanguage);
      
      // Cache the translation
      setTranslatedMessages(prev => new Map(prev).set(messageId, {
        originalText,
        translatedText,
        userLanguage
      }));

      return translatedText;
    } catch (error) {
      console.error('Auto-translate error:', error);
      return originalText;
    }
  }, [translateText, getUserLanguage, translatedMessages]);

  // Get translated message if available
  const getTranslatedMessage = useCallback((messageId: string, originalText: string): string => {
    const cached = translatedMessages.get(messageId);
    if (cached && cached.originalText === originalText) {
      return cached.translatedText;
    }
    return originalText;
  }, [translatedMessages]);

  // Clear translations when user changes
  useEffect(() => {
    setTranslatedMessages(new Map());
  }, [user?.id]);

  return {
    autoTranslateMessage,
    getTranslatedMessage,
    translatedMessages: Array.from(translatedMessages.values())
  };
};
