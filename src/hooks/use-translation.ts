import { useState, useCallback } from 'react';

interface TranslationResult {
  translatedText: string;
  detectedLanguage: string;
  confidence: number;
}

export const useTranslation = () => {
  const [isTranslating, setIsTranslating] = useState(false);

  const translateText = useCallback(async (
    text: string, 
    targetLanguage: string = 'en'
  ): Promise<string> => {
    if (!text.trim()) return text;

    setIsTranslating(true);
    
    try {
      // Use Google Translate API (you'll need to add your API key)
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          targetLanguage,
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
  }, []);

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
    isTranslating,
  };
};
