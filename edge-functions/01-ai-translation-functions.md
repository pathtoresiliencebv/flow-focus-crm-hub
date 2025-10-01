# AI & Translation Edge Functions

Deze functies bieden AI-gestuurde functionaliteit zoals tekstverbetering, assistentie en vertaling.

---

## 1. ai-assistant

**Bestand:** `supabase/functions/ai-assistant/index.ts`

### Beschrijving
Algemene AI assistant functie die context-bewuste antwoorden genereert via OpenAI GPT-4o-mini.

### Kenmerken
- Ondersteuning voor verschillende types: chat, email, project, quote, invoice, general
- Streaming en reguliere response modes
- User profiel integratie voor gepersonaliseerde antwoorden
- Automatische logging van AI gebruik

### Request Parameters
```typescript
{
  prompt: string;           // Gebruikersvraag
  context?: string;         // Extra context
  type?: string;            // Type: 'chat' | 'email' | 'project' | 'quote' | 'invoice' | 'general'
  stream?: boolean;         // Streaming response (default: false)
}
```

### Response
```typescript
{
  response: string;         // AI gegenereerd antwoord
  type: string;            // Type van request
  usage: {                 // OpenAI token usage
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  }
}
```

### Environment Variables
- `OPENAI_API_KEY` - OpenAI API sleutel
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key

---

## 2. ai-text-enhancement

**Bestand:** `supabase/functions/ai-text-enhancement/index.ts`

### Beschrijving
Verbetert teksten voor offertes met AI, maakt ze professioneler en technisch correct.

### Kenmerken
- Specifieke prompts voor product beschrijvingen vs. tekstblokken
- Behoudt kernboodschap
- Nederlands geoptimaliseerd
- Lage temperature (0.3) voor consistente output

### Request Parameters
```typescript
{
  text: string;            // Te verbeteren tekst
  context?: string;        // Context: 'product' of 'textblock'
}
```

### Response
```typescript
{
  enhancedText: string;    // Verbeterde tekst
}
```

### Environment Variables
- `OPENAI_API_KEY` - OpenAI API sleutel

---

## 3. enhanced-translation

**Bestand:** `supabase/functions/enhanced-translation/index.ts`

### Beschrijving
Geavanceerde vertaalfunctie met context-specifieke vertaling (technical, formal, casual).

### Kenmerken
- Context-aware vertaling (technical, formal, casual)
- Ondersteuning voor Nederlands, Pools, Tsjechisch, Duits, Engels
- Automatische taaldetectie
- Confidence scores

### Request Parameters
```typescript
{
  text: string;              // Te vertalen tekst
  fromLanguage: string;      // Brontaal (nl, pl, cs, de, en)
  toLanguage: string;        // Doeltaal
  context?: string;          // Context: 'technical' | 'casual' | 'formal'
}
```

### Response
```typescript
{
  translatedText: string;    // Vertaalde tekst
  confidence: number;        // Betrouwbaarheidsscore (0-1)
  fromLanguage: string;      // Brontaal
  toLanguage: string;        // Doeltaal
  context: string;           // Gebruikte context
}
```

### Environment Variables
- `OPENAI_API_KEY` - OpenAI API sleutel

---

## 4. translate-message

**Bestand:** `supabase/functions/translate-message/index.ts`

### Beschrijving
Bericht vertaalfunctie met caching via Google Translate API.

### Kenmerken
- Automatische taaldetectie
- Cache systeem voor herhaalde vertalingen
- Google Translate API integratie
- Fallback naar originele tekst bij fouten

### Request Parameters
```typescript
{
  text: string;              // Te vertalen tekst
  fromLanguage?: string;     // Brontaal (optioneel, detecteert automatisch)
  toLanguage: string;        // Doeltaal
  messageId?: string;        // Message ID voor caching
}
```

### Response
```typescript
{
  translatedText: string;    // Vertaalde tekst
  originalText: string;      // Originele tekst
  fromLanguage: string;      // Gedetecteerde/opgegeven brontaal
  toLanguage: string;        // Doeltaal
  confidence: number;        // Betrouwbaarheidsscore
  cached?: boolean;          // True als uit cache
  skipped?: boolean;         // True als bron = doel taal
}
```

### Environment Variables
- `GOOGLE_TRANSLATE_API_KEY` - Google Translate API sleutel
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key

---

## 5. voice-to-text

**Bestand:** `supabase/functions/voice-to-text/index.ts`

### Beschrijving
Converteert audio opnames naar tekst via OpenAI Whisper.

### Kenmerken
- Chunk-based processing voor grote audio bestanden
- Ondersteuning voor webm audio formaat
- Nederlands standaard, multi-taal support
- Whisper-1 model

### Request Parameters
```typescript
{
  audio: string;             // Base64 encoded audio data
  language?: string;         // Taalcode (default: 'nl')
}
```

### Response
```typescript
{
  text: string;              // Getranscribeerde tekst
  language: string;          // Gedetecteerde/opgegeven taal
}
```

### Environment Variables
- `OPENAI_API_KEY` - OpenAI API sleutel

---

## Gebruik Voorbeelden

### AI Assistant - Email schrijven
```typescript
const response = await supabase.functions.invoke('ai-assistant', {
  body: {
    prompt: 'Schrijf een professionele email voor project opvolging',
    type: 'email',
    context: 'Project XYZ is bijna afgerond'
  }
});
```

### Tekst Verbetering
```typescript
const response = await supabase.functions.invoke('ai-text-enhancement', {
  body: {
    text: 'Dit product is goed',
    context: 'product'
  }
});
```

### Vertaling
```typescript
const response = await supabase.functions.invoke('enhanced-translation', {
  body: {
    text: 'Goedemorgen',
    fromLanguage: 'nl',
    toLanguage: 'en',
    context: 'formal'
  }
});
```

### Voice to Text
```typescript
const response = await supabase.functions.invoke('voice-to-text', {
  body: {
    audio: base64AudioData,
    language: 'nl'
  }
});
```

---

## Best Practices

1. **Rate Limiting**: Implementeer client-side throttling voor AI calls
2. **Error Handling**: Vang API fouten op en toon gebruiksvriendelijke berichten
3. **Caching**: Gebruik translate-message voor berichten met messageId voor caching
4. **Context**: Gebruik altijd de juiste context voor betere AI resultaten
5. **Token Management**: Monitor OpenAI token usage voor kostenbeheersing

