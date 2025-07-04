# AI Text Enhancement Integration

## Overzicht
AI-gedreven tekstverbetering voor offerte tekstinvoer om professionele en duidelijke teksten te genereren.

## Implementatie

### Edge Function
- **Naam**: `ai-text-enhancement`
- **Model**: GPT-4o-mini (cost-effective)
- **Input**: Tekst + context (product/textblock)
- **Output**: Verbeterde professionele tekst

### Hook
```typescript
const { enhanceText, isEnhancing } = useAITextEnhancement();
```

### AI Enhance Button Component
- **Locatie**: `src/components/ui/ai-enhance-button.tsx`
- **Icon**: Sparkles voor AI functionaliteit
- **States**: Loading, disabled, active

## Gebruik in Quotes

### Product Beschrijvingen
- Context: `'product'`
- Prompt: Professionele productbeschrijving voor bouwprojecten
- Technisch correct en duidelijk

### Tekstblokken
- Context: `'textblock'`
- Prompt: Algemene tekstverbetering voor offerte
- Goed leesbaar en professioneel

## Integration Points

### QuoteBlockForm.tsx
- AI knop naast product beschrijving textarea
- AI knop naast tekstblok content textarea
- Real-time tekstvervanging

### QuoteItemForm.tsx
- AI knop bij product beschrijving veld
- Automatische verbetering op klik

## Error Handling
- Toast notifications voor success/error
- Fallback naar originele tekst bij falen
- Graceful degradation zonder AI

## Performance
- Lightweight knop component
- Async enhancement zonder blocking UI
- Loading states voor user feedback

## Security
- API key via Supabase secrets
- Rate limiting via OpenAI
- Input validation en sanitization

## User Experience
- Subtiele AI indicator
- Instant feedback via toast
- Non-intrusive enhancement workflow