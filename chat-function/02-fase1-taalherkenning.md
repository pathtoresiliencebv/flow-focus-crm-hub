# Fase 1: Intelligente Taalherkenning & Browser Detectie

## Doelstellingen
- Automatische detectie van browser/app taal
- Uitgebreide meertalige ondersteuning
- Persistentie van taalvoorkeuren
- Verbeterde translation service

## Te Implementeren Bestanden

### 1.1 Language Detection Service
**Bestand**: `src/services/languageDetectionService.ts`

```typescript
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
  detectBrowserLanguage(): string
  detectFromContent(text: string): DetectedLanguage
  getUserLanguagePreference(userId: string): Promise<string>
  setUserLanguagePreference(userId: string, language: string): Promise<void>
  getOptimalLanguage(userId: string, content?: string): Promise<string>
}
```

**Features**:
- Detecteer browser taal via `navigator.language`
- Fallback naar gebruikersprofiel
- Content-based language detection
- Machine learning voor taalherkenning verbetering

### 1.2 Enhanced Translation Service
**Bestand**: `src/services/enhancedTranslationService.ts`

```typescript
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

class EnhancedTranslationService {
  translateText(request: TranslationRequest): Promise<TranslationResponse>
  translateBatch(requests: TranslationRequest[]): Promise<TranslationResponse[]>
  cacheTranslation(original: string, translated: string, languages: string[]): Promise<void>
  getContextualTranslation(text: string, projectContext: any): Promise<string>
}
```

**Verbeteringen**:
- OpenAI GPT-4 voor real-time vertaling
- Contextbehoud voor betere vertalingen
- Detectie van vakjargon en technische termen
- Caching van veelgebruikte vertalingen
- Batch processing voor efficiëntie

### 1.3 Database Schema Wijzigingen

```sql
-- Uitbreiden profiles tabel
ALTER TABLE profiles ADD COLUMN language_preference VARCHAR(5) DEFAULT 'nl';
ALTER TABLE profiles ADD COLUMN timezone VARCHAR(50) DEFAULT 'Europe/Amsterdam';
ALTER TABLE profiles ADD COLUMN language_detection_enabled BOOLEAN DEFAULT TRUE;

-- Uitbreiden direct_messages tabel
ALTER TABLE direct_messages ADD COLUMN detected_language VARCHAR(5);
ALTER TABLE direct_messages ADD COLUMN translation_confidence DECIMAL(3,2);
ALTER TABLE direct_messages ADD COLUMN context_type VARCHAR(20) DEFAULT 'casual';

-- Nieuwe tabel voor translation cache
CREATE TABLE translation_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_text TEXT NOT NULL,
  source_language VARCHAR(5) NOT NULL,
  target_language VARCHAR(5) NOT NULL,
  translated_text TEXT NOT NULL,
  context_type VARCHAR(20),
  confidence DECIMAL(3,2),
  usage_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index voor snelle cache lookups
CREATE INDEX idx_translation_cache_lookup ON translation_cache(source_text, source_language, target_language);
```

### 1.4 Edge Function: Language Detection
**Bestand**: `supabase/functions/language-detection/index.ts`

```typescript
interface LanguageDetectionRequest {
  text: string;
  browserLanguage?: string;
  userId?: string;
  context?: 'chat' | 'document' | 'voice';
}

// Features:
// - Advanced language detection using multiple algorithms
// - Learning from user corrections
// - Context-aware detection
// - Confidence scoring
```

## Acceptatie Criteria
- [ ] Browser taal wordt automatisch gedetecteerd bij eerste login
- [ ] Gebruikers kunnen handmatig taalvoorkeur wijzigen
- [ ] Taaldetectie werkt voor alle ondersteunde talen (nl, pl, cs, de, en)
- [ ] Translation cache vermindert API calls met 70%+
- [ ] Contextuele vertalingen zijn accurater dan huidige implementatie
- [ ] Fallback mechanismen werken correct

## Testing Scenario's
1. **Browser Language Detection**: Test met verschillende browser taal instellingen
2. **Content Detection**: Test taaldetectie op gemengde teksten
3. **Translation Accuracy**: Vergelijk met huidige mock service
4. **Cache Performance**: Test cache hit rates en performance
5. **Fallback Behavior**: Test wanneer detection faalt

## Dependencies
```json
{
  "franc": "^6.0.0",
  "@vitalets/google-translate-api": "^9.2.0",
  "i18next": "^23.0.0",
  "i18next-browser-languagedetector": "^7.0.0"
}
```