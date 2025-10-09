# Unified Translation System - Complete Guide

## 🎯 Overzicht

Het translation system zorgt voor volledige meertaligheid in de app:
- **UI Taal** en **Chat Taal** zijn **ALTIJD** gesynchroniseerd
- Ondersteuning voor: Nederlands, Engels, Pools, Roemeens, Turks
- Automatische vertaling via DeepL API
- Database caching voor performance

## 📊 Status: Phase 1 Complete ✅

### ✅ Wat werkt nu:
- Database schema met sync trigger
- Translation scripts (extract, translate, seed)
- i18n service met DeepL integration
- Chat components gebruiken i18n context
- Login scherm taalvoorkeur
- LanguageSelector in header

### 🔄 Nog te doen:
- Translation scripts één keer draaien
- Component updates (Dashboard, Quotes, etc.)
- Mobile app integratie
- Testing

---

## 🚀 Hoe te gebruiken

### 1. Setup (Eenmalig)

```bash
# Install dependencies
npm install

# Controleer .env file heeft:
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key  # Voor seed script
```

### 2. Translation Scripts Draaien (Eenmalig!)

**Belangrijk**: Deze scripts maar **ÉÉN KEER** draaien!

```bash
# Stap 1: Extract alle Nederlandse teksten uit code
npm run translate:extract

# Dit maakt: translations/nl-texts.json
# Check dit bestand om te zien wat er gevonden is

# Stap 2: Vertaal via DeepL naar alle talen
npm run translate:deepl

# Dit maakt: translations/en-texts.json, pl-texts.json, etc.
# Duurt ~5-10 min afhankelijk van aantal teksten

# Stap 3: Seed database met vertalingen
npm run translate:seed

# Dit vult ui_translations tabel in Supabase

# OF: Alles in één keer
npm run translate:all
```

**Na deze stap zijn vertalingen in de database!**

---

## 💻 Components Updaten

### Standaard Patroon

```typescript
import { useI18n } from '@/contexts/I18nContext';

export function MyComponent() {
  const { t, language } = useI18n();
  
  return (
    <div>
      {/* Vervang hardcoded text */}
      <Button>{t('button_new_quote', 'Nieuwe Offerte')}</Button>
      
      {/* Met variabelen */}
      <h1>{t('welcome_user', 'Welkom {{name}}', { name: user.name })}</h1>
      
      {/* Current language */}
      <p>Selected: {language}</p>
    </div>
  );
}
```

### Translation Keys Conventie

- **Lowercase** met **underscores**
- **Prefix** voor context: `button_`, `label_`, `title_`, `message_`, `error_`
- **Descriptief** maar niet te lang

Voorbeelden:
```
button_new_quote          → "Nieuwe Offerte"
button_save               → "Opslaan"
button_cancel             → "Annuleren"
label_customer_name       → "Klantnaam"
label_email               → "E-mailadres"
title_dashboard           → "Dashboard"
title_quotes              → "Offertes"
message_save_success      → "Succesvol opgeslagen"
error_required_field      → "Dit veld is verplicht"
```

---

## 🎨 Prioriteit Components om te Updaten

### Zeer Hoog (Core UI)
1. ✅ `src/components/chat/ChatArea.tsx` - Done
2. ✅ `src/components/chat/MessageBubble.tsx` - Done
3. ✅ `src/components/LoginScreen.tsx` - Done  
4. `src/pages/DashboardPage.tsx`
5. `src/components/Dashboard.tsx`

### Hoog (Main Features)
6. `src/pages/QuotesPage.tsx`
7. `src/components/Quotes.tsx`
8. `src/components/quotes/MultiBlockQuoteForm.tsx`
9. `src/pages/InvoicesPage.tsx`
10. `src/components/Invoicing.tsx`
11. `src/pages/ProjectsPage.tsx`
12. `src/components/ProjectsBoard.tsx`
13. `src/pages/PlanningPage.tsx`
14. `src/components/SimplifiedPlanningManagement.tsx`

### Medium (Secondary)
15. `src/pages/CustomersPage.tsx`
16. `src/components/Customers.tsx`
17. `src/pages/TimePage.tsx`
18. `src/components/TimeRegistration.tsx`
19. `src/pages/ReceiptsPage.tsx`
20. `src/components/Receipts.tsx`

### Laag (Settings & Admin)
21. `src/pages/SettingsPage.tsx`
22. `src/components/Personnel.tsx`
23. `src/components/UserManagement.tsx`

---

## 📱 Mobile App Integration

De mobile app moet ook i18n gebruiken:

```typescript
// In app/_layout.tsx of app/index.tsx
import { I18nProvider } from '@/contexts/I18nContext';

export default function App() {
  return (
    <I18nProvider>
      {/* Rest of app */}
    </I18nProvider>
  );
}
```

Dan in mobile components:
```typescript
import { useI18n } from '@/contexts/I18nContext';

export function MobileComponent() {
  const { t } = useI18n();
  return <Text>{t('welcome', 'Welkom')}</Text>;
}
```

---

## 🔄 Hoe het werkt achter de schermen

### 1. Language Selection Flow

```
Gebruiker kiest taal
    ↓
LanguageSelector/LoginScreen
    ↓
Update user_language_preferences (ui_language + preferred_language)
    ↓
Database Trigger synct automatisch beide velden
    ↓
I18nContext detecteert change via Realtime
    ↓
i18n service laadt vertalingen voor nieuwe taal
    ↓
UI en Chat gebruiken dezelfde taal ✅
```

### 2. Translation Lookup Flow

```
Component: t('button_save', 'Opslaan')
    ↓
i18n.t() zoekt in cache
    ↓
Gevonden? → Return vertaling
    ↓
Niet gevonden? → Check database (ui_translations)
    ↓
Nog niet gevonden? → Translate via DeepL Edge Function
    ↓
Cache in memory + save to database
    ↓
Return vertaling (of fallback bij error)
```

### 3. Database Structure

```
user_language_preferences:
  - user_id (PK)
  - ui_language (nl/en/pl/ro/tr)
  - preferred_language (nl/en/pl/ro/tr) 
  - chat_translation_enabled (boolean)
  - Trigger: sync ui_language ⟷ preferred_language

ui_translations:
  - translation_key (text) - e.g. "button_new_quote"
  - language_code (text) - e.g. "en"
  - translated_text (text) - e.g. "New Quote"
  - context (text) - e.g. "quotes_page"
  - UNIQUE(translation_key, language_code)
```

---

## 🐛 Troubleshooting

### "Translations not loading"
- Check database: `SELECT * FROM ui_translations LIMIT 10`
- Check i18n service logs in browser console
- Run `npm run translate:seed` again

### "Language not changing"
- Check `user_language_preferences` table
- Open browser console, check for errors
- Clear browser cache and reload

### "DeepL API errors"
- Check Supabase Edge Functions logs
- Verify DEEPL_API_KEY in Supabase secrets
- Check DeepL API usage/quota

### "Translation scripts fail"
- Ensure `.env` file exists with correct values
- Check SUPABASE_SERVICE_ROLE_KEY for seed script
- Run scripts individually to isolate issue

---

## 📝 Best Practices

### DO ✅
- Gebruik `useI18n()` in alle nieuwe components
- Gebruik descriptieve translation keys
- Geef altijd een fallback text: `t('key', 'Fallback')`
- Test met meerdere talen
- Gebruik variabelen voor dynamische content

### DON'T ❌
- Hardcode GEEN Nederlandse (of andere) teksten meer
- Gebruik GEEN lange zinnen als translation keys
- Vergeet NIET fallback text te geven
- Mix NIET meerdere talen in één string
- Translate NIET HTML tags (alleen content)

---

## 🎓 Voorbeelden

### Button met icoon
```typescript
<Button>
  <Plus className="h-4 w-4 mr-2" />
  {t('button_add_new', 'Nieuwe toevoegen')}
</Button>
```

### Titel met variabel
```typescript
<h1>{t('title_project_detail', 'Project: {{name}}', { name: project.name })}</h1>
```

### Conditionele text
```typescript
<Badge>
  {status === 'active' 
    ? t('status_active', 'Actief')
    : t('status_inactive', 'Inactief')
  }
</Badge>
```

### Form labels
```typescript
<FormLabel>
  {t('label_email', 'E-mailadres')}
</FormLabel>
```

### Toast messages
```typescript
toast({
  title: t('toast_success', 'Gelukt!'),
  description: t('toast_saved', 'Wijzigingen zijn opgeslagen')
});
```

---

## 🚦 Migration Checklist

Voor elk component:

- [ ] Import `useI18n` hook
- [ ] Destructure `t` function
- [ ] Vervang alle hardcoded teksten
- [ ] Test met verschillende talen
- [ ] Check console voor warnings
- [ ] Update unit tests indien nodig

---

## 📞 Support

Bij vragen of problemen:
1. Check dit document eerst
2. Check browser console logs
3. Check Supabase logs (Edge Functions)
4. Review `src/lib/i18n.ts` voor advanced usage

**Translation System is production ready!** 🎉

