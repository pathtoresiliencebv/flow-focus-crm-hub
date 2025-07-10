interface TranslationRequest {
  text: string;
  fromLanguage: string;
  toLanguage: string;
  context?: 'technical' | 'casual' | 'formal';
  projectId?: string;
}

interface TranslationResponse {
  translatedText: string;
  confidence: number;
  alternatives?: string[];
  cached: boolean;
}

interface CacheEntry {
  source_text: string;
  source_language: string;
  target_language: string;
  translated_text: string;
  context_type?: string;
  confidence: number;
  usage_count: number;
}

class EnhancedTranslationService {
  private cache = new Map<string, CacheEntry>();

  /**
   * Generate cache key for translation lookup
   */
  private getCacheKey(text: string, fromLang: string, toLang: string, context?: string): string {
    return `${fromLang}-${toLang}-${context || 'default'}-${text.trim().toLowerCase()}`;
  }

  /**
   * Load cached translations from database
   */
  private async loadCacheFromDB(cacheKey: string): Promise<CacheEntry | null> {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const [fromLang, toLang, context, ...textParts] = cacheKey.split('-');
      const text = textParts.join('-');

      const { data, error } = await supabase
        .from('translation_cache')
        .select('*')
        .eq('source_text', text)
        .eq('source_language', fromLang)
        .eq('target_language', toLang)
        .eq('context_type', context === 'default' ? null : context)
        .maybeSingle();

      if (error || !data) {
        return null;
      }

      return data as CacheEntry;
    } catch (error) {
      console.error('Error loading translation cache:', error);
      return null;
    }
  }

  /**
   * Save translation to cache
   */
  async cacheTranslation(
    original: string, 
    translated: string, 
    fromLang: string, 
    toLang: string, 
    context?: string,
    confidence: number = 0.9
  ): Promise<void> {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const cacheEntry = {
        source_text: original.trim(),
        source_language: fromLang,
        target_language: toLang,
        translated_text: translated,
        context_type: context || null,
        confidence,
        usage_count: 1
      };

      // Try to update existing entry first
      const { data: existing } = await supabase
        .from('translation_cache')
        .select('usage_count')
        .eq('source_text', cacheEntry.source_text)
        .eq('source_language', fromLang)
        .eq('target_language', toLang)
        .eq('context_type', cacheEntry.context_type)
        .maybeSingle();

      if (existing) {
        // Update usage count and last used
        await supabase
          .from('translation_cache')
          .update({ 
            usage_count: existing.usage_count + 1,
            last_used_at: new Date().toISOString()
          })
          .eq('source_text', cacheEntry.source_text)
          .eq('source_language', fromLang)
          .eq('target_language', toLang)
          .eq('context_type', cacheEntry.context_type);
      } else {
        // Insert new entry
        await supabase
          .from('translation_cache')
          .insert(cacheEntry);
      }

      // Update local cache
      const cacheKey = this.getCacheKey(original, fromLang, toLang, context);
      this.cache.set(cacheKey, cacheEntry);
    } catch (error) {
      console.error('Error caching translation:', error);
    }
  }

  /**
   * Translate text using OpenAI with caching
   */
  async translateText(request: TranslationRequest): Promise<TranslationResponse> {
    const { text, fromLanguage, toLanguage, context } = request;

    // Skip translation if same language
    if (fromLanguage === toLanguage) {
      return {
        translatedText: text,
        confidence: 1.0,
        cached: false
      };
    }

    // Check cache first
    const cacheKey = this.getCacheKey(text, fromLanguage, toLanguage, context);
    let cachedEntry = this.cache.get(cacheKey);
    
    if (!cachedEntry) {
      cachedEntry = await this.loadCacheFromDB(cacheKey);
      if (cachedEntry) {
        this.cache.set(cacheKey, cachedEntry);
      }
    }

    if (cachedEntry) {
      return {
        translatedText: cachedEntry.translated_text,
        confidence: cachedEntry.confidence,
        cached: true
      };
    }

    // Translate using OpenAI
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const { data, error } = await supabase.functions.invoke('enhanced-translation', {
        body: {
          text,
          fromLanguage,
          toLanguage,
          context: context || 'casual'
        }
      });

      if (error) {
        throw error;
      }

      const response: TranslationResponse = {
        translatedText: data.translatedText,
        confidence: data.confidence || 0.8,
        cached: false
      };

      // Cache the result
      await this.cacheTranslation(
        text, 
        response.translatedText, 
        fromLanguage, 
        toLanguage, 
        context,
        response.confidence
      );

      return response;
    } catch (error) {
      console.error('Translation error:', error);
      
      // Fallback to simple mock translation
      return {
        translatedText: `[${toLanguage.toUpperCase()}] ${text}`,
        confidence: 0.1,
        cached: false
      };
    }
  }

  /**
   * Translate batch of texts
   */
  async translateBatch(requests: TranslationRequest[]): Promise<TranslationResponse[]> {
    const results = await Promise.allSettled(
      requests.map(request => this.translateText(request))
    );

    return results.map(result => 
      result.status === 'fulfilled' 
        ? result.value 
        : {
            translatedText: '[ERROR] Translation failed',
            confidence: 0,
            cached: false
          }
    );
  }

  /**
   * Get contextual translation with project-specific terminology
   */
  async getContextualTranslation(text: string, projectContext: any, fromLang: string, toLang: string): Promise<string> {
    // Enhanced context-aware translation logic
    const contextualRequest: TranslationRequest = {
      text,
      fromLanguage: fromLang,
      toLanguage: toLang,
      context: projectContext?.type === 'technical' ? 'technical' : 'casual',
      projectId: projectContext?.id
    };

    const result = await this.translateText(contextualRequest);
    return result.translatedText;
  }

  /**
   * Clear cache (for maintenance)
   */
  clearCache(): void {
    this.cache.clear();
  }
}

export const enhancedTranslationService = new EnhancedTranslationService();