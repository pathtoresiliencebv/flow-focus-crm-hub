/**
 * i18n Configuration for Platform-wide Translation
 * 
 * This handles UI translations for the entire platform based on user's language preference.
 * Uses DeepL for dynamic translations and caches results in database.
 */

import { supabase } from '@/integrations/supabase/client';

// Supported languages: Dutch, English, Polish, Romanian, Turkish
export type Language = 'nl' | 'en' | 'pl' | 'ro' | 'tr';

export interface TranslationCache {
  [key: string]: {
    [lang: string]: string;
  };
}

class I18nService {
  private cache: TranslationCache = {};
  private currentLanguage: Language = 'nl';
  private fallbackLanguage: Language = 'nl';
  private isLoading: boolean = false;
  private listeners: Set<() => void> = new Set();

  /**
   * Initialize i18n with user's language
   */
  async initialize(userId: string): Promise<void> {
    try {
      // Get user's UI language preference
      const { data, error } = await supabase
        .from('user_language_preferences')
        .select('ui_language')
        .eq('user_id', userId)
        .single();

      if (!error && data?.ui_language) {
        this.currentLanguage = data.ui_language as Language;
      }

      // Load cached translations for this language
      await this.loadCachedTranslations(this.currentLanguage);
    } catch (error) {
      console.error('Failed to initialize i18n:', error);
    }
  }

  /**
   * Get translation for a key
   * If not in cache, translate on-the-fly via Google Translate
   */
  t(key: string, fallback?: string, variables?: Record<string, string>): string {
    // Check cache first
    if (this.cache[key]?.[this.currentLanguage]) {
      const translation = this.cache[key][this.currentLanguage];
      return variables ? this.interpolate(translation, variables) : translation;
    }

    // If not in cache and not in fallback language, queue for translation
    if (this.currentLanguage !== this.fallbackLanguage && key && key.length > 2) {
      // Translate async in background (don't block UI)
      this.translateOnTheFly(key);
    }

    // Return fallback while translation is happening
    const fallbackText = fallback || key;
    return variables ? this.interpolate(fallbackText, variables) : fallbackText;
  }

  /**
   * Translate a single text on-the-fly using DeepL via Edge Function
   */
  private async translateOnTheFly(text: string): Promise<void> {
    // Check if already being translated or in cache
    if (this.cache[text]?.[this.currentLanguage]) return;

    try {
      console.log(`🔄 Translating on-the-fly: "${text}" to ${this.currentLanguage}`);
      
      // Use DeepL via Edge Function for single text
      const { data, error } = await supabase.functions.invoke('translate-text', {
        body: {
          text: text,
          targetLang: this.currentLanguage,
          sourceLang: this.fallbackLanguage
        }
      });

      if (error) {
        console.error('DeepL translation error:', error);
        return;
      }

      if (data?.translatedText) {
        const translatedText = data.translatedText;

        // Cache in memory
        if (!this.cache[text]) this.cache[text] = {};
        this.cache[text][this.currentLanguage] = translatedText;

        // Save to database in background (don't await)
        supabase.from('ui_translations').upsert({
          translation_key: text,
          language_code: this.currentLanguage,
          translated_text: translatedText,
          context: 'auto_deepl',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'translation_key,language_code'
        }).then(({ error: dbError }) => {
          if (dbError) console.warn('Failed to cache translation:', dbError);
        });
        
        console.log(`✅ Translated: "${text}" → "${translatedText}"`);
      }
    } catch (error) {
      console.error('On-the-fly translation error:', error);
    }
  }

  /**
   * Translate multiple keys at once
   */
  async translateKeys(keys: string[]): Promise<void> {
    const missingKeys = keys.filter(key => !this.cache[key]?.[this.currentLanguage]);
    
    if (missingKeys.length === 0) return;

    this.isLoading = true;

    try {
      // Check database cache first
      const { data: cachedTranslations } = await supabase
        .from('ui_translations')
        .select('translation_key, translated_text')
        .in('translation_key', missingKeys)
        .eq('language_code', this.currentLanguage);

      if (cachedTranslations) {
        cachedTranslations.forEach(t => {
          if (!this.cache[t.translation_key]) {
            this.cache[t.translation_key] = {};
          }
          this.cache[t.translation_key][this.currentLanguage] = t.translated_text;
        });
      }

      // If still missing, fetch from DeepL
      const stillMissing = missingKeys.filter(key => !this.cache[key]?.[this.currentLanguage]);
      
      if (stillMissing.length > 0 && this.currentLanguage !== this.fallbackLanguage) {
        await this.fetchTranslationsFromDeepL(stillMissing);
      }
    } catch (error) {
      console.error('Failed to translate keys:', error);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Change current language
   */
  async setLanguage(language: Language, userId?: string): Promise<void> {
    if (this.currentLanguage === language) return;

    console.log(`🌍 i18n: Changing language from ${this.currentLanguage} to ${language}`);
    this.currentLanguage = language;

    // Update user preference in database (both UI and chat language)
    if (userId) {
      await supabase
        .from('user_language_preferences')
        .upsert({
          user_id: userId,
          ui_language: language,
          preferred_language: language, // Sync chat language with UI language
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });
    }

    // Load translations for new language
    await this.loadCachedTranslations(language);
    
    // Notify all listeners that language has changed
    console.log(`🔔 i18n: Notifying ${this.listeners.size} listeners of language change`);
    this.listeners.forEach(listener => listener());
  }
  
  /**
   * Subscribe to language changes
   */
  subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Get current language
   */
  getLanguage(): Language {
    return this.currentLanguage;
  }

  /**
   * Check if translations are loading
   */
  isTranslationsLoading(): boolean {
    return this.isLoading;
  }

  /**
   * Load cached translations from database
   */
  private async loadCachedTranslations(language: Language): Promise<void> {
    try {
      const { data: translations } = await supabase
        .from('ui_translations')
        .select('translation_key, translated_text')
        .eq('language_code', language);

      if (translations) {
        translations.forEach(t => {
          if (!this.cache[t.translation_key]) {
            this.cache[t.translation_key] = {};
          }
          this.cache[t.translation_key][language] = t.translated_text;
        });
      }
    } catch (error) {
      console.error('Failed to load cached translations:', error);
    }
  }

  /**
   * Fetch translations from DeepL and cache them
   */
  private async fetchTranslationsFromDeepL(keys: string[]): Promise<void> {
    try {
      // Get Dutch fallback texts
      const textsToTranslate = keys.map(key => 
        this.cache[key]?.[this.fallbackLanguage] || key
      );

      // Call edge function for translation
      const { data, error } = await supabase.functions.invoke('translate-ui-texts', {
        body: {
          texts: textsToTranslate,
          targetLanguage: this.currentLanguage,
          sourceLanguage: this.fallbackLanguage
        }
      });

      if (error) throw error;

      // Cache results in memory and database
      if (data?.translations) {
        const translationsToCache = keys.map((key, index) => ({
          translation_key: key,
          language_code: this.currentLanguage,
          translated_text: data.translations[index],
          context: 'auto_generated',
          updated_at: new Date().toISOString()
        }));

        // Update cache
        translationsToCache.forEach(t => {
          if (!this.cache[t.translation_key]) {
            this.cache[t.translation_key] = {};
          }
          this.cache[t.translation_key][this.currentLanguage] = t.translated_text;
        });

        // Store in database
        await supabase
          .from('ui_translations')
          .upsert(translationsToCache, {
            onConflict: 'translation_key,language_code'
          });
      }
    } catch (error) {
      console.error('Failed to fetch translations from DeepL:', error);
    }
  }

  /**
   * Interpolate variables into translation
   */
  private interpolate(text: string, variables: Record<string, string>): string {
    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key] || match;
    });
  }

  /**
   * Translate user-generated content back to Dutch (for project completions)
   */
  async translateToNL(text: string, sourceLanguage?: Language): Promise<string> {
    if (!text || text.trim().length === 0) return text;

    // If already in Dutch, return as-is
    if (sourceLanguage === 'nl') return text;

    try {
      const { data, error } = await supabase.functions.invoke('translate-message', {
        body: {
          text,
          toLanguage: 'nl',
          fromLanguage: sourceLanguage || 'auto'
        }
      });

      if (error) throw error;

      return data?.translatedText || text;
    } catch (error) {
      console.error('Failed to translate to NL:', error);
      return text; // Return original on error
    }
  }
}

// Singleton instance
export const i18n = new I18nService();

// Helper hook for use in components
export function useI18n() {
  return {
    t: i18n.t.bind(i18n),
    setLanguage: i18n.setLanguage.bind(i18n),
    getLanguage: i18n.getLanguage.bind(i18n),
    translateToNL: i18n.translateToNL.bind(i18n),
    isLoading: i18n.isTranslationsLoading.bind(i18n)
  };
}

