interface LanguageDetectionConfig {
  supportedLanguages: string[];
  fallbackLanguage: string;
  autoDetect: boolean;
}

interface DetectedLanguage {
  code: string;
  confidence: number;
  source: 'browser' | 'profile' | 'content' | 'fallback';
}

class LanguageDetectionService {
  private config: LanguageDetectionConfig = {
    supportedLanguages: ['nl', 'pl', 'cs', 'de', 'en'],
    fallbackLanguage: 'nl',
    autoDetect: true
  };

  /**
   * Detect browser language from navigator
   */
  detectBrowserLanguage(): string {
    const browserLang = navigator.language || navigator.languages?.[0] || this.config.fallbackLanguage;
    
    // Extract language code (e.g., 'pl-PL' -> 'pl')
    const langCode = browserLang.toLowerCase().split('-')[0];
    
    // Check if detected language is supported
    if (this.config.supportedLanguages.includes(langCode)) {
      return langCode;
    }
    
    return this.config.fallbackLanguage;
  }

  /**
   * Detect language from text content using basic patterns
   */
  detectFromContent(text: string): DetectedLanguage {
    if (!text || text.length < 10) {
      return {
        code: this.config.fallbackLanguage,
        confidence: 0.1,
        source: 'fallback'
      };
    }

    // Simple pattern-based detection for common words
    const patterns = {
      'nl': /\b(de|het|en|van|is|een|dat|te|voor|met|op|zijn|hebben|wordt|wordt|maar|als|door|naar)\b/gi,
      'pl': /\b(i|w|z|na|do|się|że|jest|to|nie|ma|już|był|będzie|może|przez|aby)\b/gi,
      'de': /\b(der|die|das|und|ist|in|zu|den|von|mit|sich|auf|für|wird|werden|hat|haben)\b/gi,
      'en': /\b(the|and|is|in|to|of|a|that|it|with|for|as|was|on|are|you|have|be)\b/gi,
      'cs': /\b(a|v|na|se|je|to|že|s|do|o|jako|tak|by|který|jeho)\b/gi
    };

    let bestMatch = {
      language: this.config.fallbackLanguage,
      score: 0
    };

    for (const [lang, pattern] of Object.entries(patterns)) {
      const matches = text.match(pattern);
      const score = matches ? matches.length / text.split(' ').length : 0;
      
      if (score > bestMatch.score) {
        bestMatch = { language: lang, score };
      }
    }

    return {
      code: bestMatch.language,
      confidence: Math.min(bestMatch.score * 2, 1), // Scale to 0-1
      source: 'content'
    };
  }

  /**
   * Get user's language preference from profile
   */
  async getUserLanguagePreference(userId: string): Promise<string> {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data, error } = await supabase
        .from('profiles')
        .select('language_preference')
        .eq('id', userId)
        .single();

      if (error || !data?.language_preference) {
        return this.config.fallbackLanguage;
      }

      return data.language_preference;
    } catch (error) {
      console.error('Error fetching user language preference:', error);
      return this.config.fallbackLanguage;
    }
  }

  /**
   * Set user's language preference
   */
  async setUserLanguagePreference(userId: string, language: string): Promise<void> {
    try {
      if (!this.config.supportedLanguages.includes(language)) {
        throw new Error(`Unsupported language: ${language}`);
      }

      const { supabase } = await import('@/integrations/supabase/client');
      const { error } = await supabase
        .from('profiles')
        .update({ language_preference: language })
        .eq('id', userId);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error setting user language preference:', error);
      throw error;
    }
  }

  /**
   * Get optimal language for user with fallbacks
   */
  async getOptimalLanguage(userId: string, content?: string): Promise<string> {
    try {
      // 1. Try user preference first
      const userPreference = await this.getUserLanguagePreference(userId);
      if (userPreference && userPreference !== this.config.fallbackLanguage) {
        return userPreference;
      }

      // 2. Try content detection if available
      if (content) {
        const detected = this.detectFromContent(content);
        if (detected.confidence > 0.6) {
          return detected.code;
        }
      }

      // 3. Fall back to browser language
      const browserLang = this.detectBrowserLanguage();
      if (browserLang !== this.config.fallbackLanguage) {
        return browserLang;
      }

      // 4. Final fallback
      return this.config.fallbackLanguage;
    } catch (error) {
      console.error('Error getting optimal language:', error);
      return this.config.fallbackLanguage;
    }
  }

  /**
   * Get language name for display
   */
  getLanguageName(code: string): string {
    const names: Record<string, string> = {
      'nl': 'Nederlands',
      'pl': 'Polski',
      'cs': 'Čeština',
      'de': 'Deutsch', 
      'en': 'English'
    };
    return names[code] || code;
  }
}

export const languageDetectionService = new LanguageDetectionService();