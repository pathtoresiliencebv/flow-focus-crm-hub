# 🌍 Platform-brede Vertaling Implementatie

## 📋 Overzicht

Complete implementatie voor:
1. **✅ Platform-brede UI vertaling** - Hele interface in taal van monteur
2. **✅ Auto-vertaling naar Nederlands** - Project samenvattingen terug naar NL
3. **✅ DeepL integratie** - Voor hoogwaardige vertalingen

---

## 🏗️ Architectuur

### Componenten

```
┌─────────────────────────────────────────────────────────┐
│                    USER LOGIN                            │
│  Monteur logt in → Systeem detecteert taal voorkeur    │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│               I18nProvider Init                          │
│  • Laad user language preference (bijv. 'pl')          │
│  • Laad cached UI vertalingen                          │
│  • Stel current language in                             │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│           PLATFORM UI IN MONTEUR TAAL                    │
│  • Alle buttons, labels, menu's in Pools               │
│  • useI18n().t('key') voor vertalingen                  │
│  • Auto-fetch missing translations via DeepL           │
└─────────────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│        MONTEUR RONDT PROJECT AF                          │
│  • Schrijft samenvatting in eigen taal (Pools)         │
│  • useProjectCompletionTranslation hook                 │
│  • Auto-detect: tekst is in Pools                       │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│       AUTO-VERTALING NAAR NEDERLANDS                     │
│  • work_performed: "Zainstalowano okna" → "Ramen geïnstalleerd" │
│  • Opslaan in database:                                 │
│    - work_performed: Nederlands (voor admins)          │
│    - original_work_performed: Pools (origineel)        │
│    - installer_language: 'pl'                           │
└─────────────────────────────────────────────────────────┘
```

---

## 📁 Bestanden Structuur

### Nieuwe Bestanden

```
src/
├── lib/
│   └── i18n.ts                                  # Core i18n service
├── contexts/
│   └── I18nContext.tsx                          # React context provider
├── hooks/
│   └── useProjectCompletionTranslation.ts       # Project completion vertaling
└── components/
    └── ... (gebruik useI18n() hook)

supabase/
├── functions/
│   └── translate-ui-texts/
│       └── index.ts                             # Batch UI vertaling edge function
└── migrations/
    └── 20250101000000_add_translation_fields_to_completions.sql
```

---

## 🔧 Database Schema Updates

### project_completions Tabel

```sql
ALTER TABLE project_completions
ADD COLUMN original_work_performed TEXT,
ADD COLUMN original_materials_used TEXT,
ADD COLUMN original_recommendations TEXT,
ADD COLUMN original_notes TEXT,
ADD COLUMN installer_language VARCHAR(10) DEFAULT 'nl';
```

**Voorbeeld data:**

| work_performed (NL) | original_work_performed (PL) | installer_language |
|---------------------|-------------------------------|-------------------|
| "Nieuwe ramen geïnstalleerd" | "Zainstalowano nowe okna" | pl |
| "PVC kozijnen vervangen" | "Wymieniono ramy PCV" | pl |

---

## 💻 Gebruik in Code

### 1. Setup in App.tsx

```typescript
import { I18nProvider } from '@/contexts/I18nContext';

function App() {
  return (
    <AuthProvider>
      <I18nProvider>
        {/* Rest van app */}
      </I18nProvider>
    </AuthProvider>
  );
}
```

### 2. Vertaal UI Teksten

```typescript
import { useI18n } from '@/contexts/I18nContext';

function MyComponent() {
  const { t } = useI18n();

  return (
    <div>
      <h1>{t('projects.title', 'Projecten')}</h1>
      <button>{t('common.save', 'Opslaan')}</button>
      <p>{t('projects.assigned_to', 'Toegewezen aan {{name}}', { name: 'Jan' })}</p>
    </div>
  );
}
```

### 3. Component Shorthand

```typescript
import { T } from '@/contexts/I18nContext';

function MyComponent() {
  return (
    <div>
      <h1><T k="projects.title" fallback="Projecten" /></h1>
      <button><T k="common.save" fallback="Opslaan" /></button>
    </div>
  );
}
```

### 4. Project Completion met Auto-vertaling

```typescript
import { useProjectCompletionTranslation } from '@/hooks/useProjectCompletionTranslation';

function ProjectCompletionForm() {
  const { saveProjectCompletion, isTranslating } = useProjectCompletionTranslation();

  const handleSubmit = async (data: ProjectCompletionData) => {
    // Automatisch vertaald naar Nederlands!
    const result = await saveProjectCompletion(projectId, {
      work_performed: "Zainstalowano nowe okna PCV", // Pools
      materials_used: "Okna PCV, silikon",
      recommendations: "Coroczna konserwacja",
      notes: "Klient bardzo zadowolony",
      customer_satisfaction: 5
    });

    // In database staat nu:
    // work_performed: "Nieuwe PVC ramen geïnstalleerd"
    // original_work_performed: "Zainstalowano nowe okna PCV"
    // installer_language: "pl"
  };

  return (
    <form onSubmit={handleSubmit}>
      {isTranslating && <p>Vertalen...</p>}
      {/* form fields */}
    </form>
  );
}
```

---

## 🎯 Vertaling Keys Structuur

### Common (Algemeen)
```typescript
'common.save' → 'Opslaan' (nl) / 'Save' (en) / 'Zapisz' (pl)
'common.cancel' → 'Annuleren' / 'Cancel' / 'Anuluj'
'common.delete' → 'Verwijderen' / 'Delete' / 'Usuń'
'common.edit' → 'Bewerken' / 'Edit' / 'Edytuj'
'common.add' → 'Toevoegen' / 'Add' / 'Dodaj'
'common.close' → 'Sluiten' / 'Close' / 'Zamknij'
'common.loading' → 'Laden...' / 'Loading...' / 'Ładowanie...'
'common.error' → 'Fout' / 'Error' / 'Błąd'
'common.success' → 'Succesvol' / 'Success' / 'Sukces'
```

### Projects
```typescript
'projects.title' → 'Projecten' / 'Projects' / 'Projekty'
'projects.assigned_to' → 'Toegewezen aan {{name}}'
'projects.status.planning' → 'Te plannen' / 'Planning' / 'Planowanie'
'projects.status.in_progress' → 'In uitvoering' / 'In Progress' / 'W trakcie'
'projects.status.completed' → 'Afgerond' / 'Completed' / 'Ukończony'
```

### Project Completion
```typescript
'completion.work_performed' → 'Uitgevoerde werkzaamheden' / 'Work Performed' / 'Wykonane prace'
'completion.materials_used' → 'Gebruikte materialen' / 'Materials Used' / 'Użyte materiały'
'completion.recommendations' → 'Aanbevelingen' / 'Recommendations' / 'Zalecenia'
'completion.notes' → 'Notities' / 'Notes' / 'Notatki'
'completion.satisfaction' → 'Klanttevredenheid' / 'Customer Satisfaction' / 'Zadowolenie klienta'
```

---

## 🔄 Vertaling Flow

### UI Vertaling Flow

```
1. Component vraagt vertaling: t('projects.title')
2. i18n service checkt cache
3. Cache hit? → Return vertaling
4. Cache miss? → Check database
5. Database hit? → Cache + return
6. Database miss? → Fetch van DeepL
7. Store in database + cache
8. Return vertaling
```

### Project Completion Vertaling Flow

```
1. Monteur (Pools) schrijft samenvatting in Pools
2. Component: saveProjectCompletion(data)
3. Hook detecteert: user language = 'pl'
4. Auto-translate elk veld naar Nederlands:
   - work_performed: pl → nl
   - materials_used: pl → nl
   - recommendations: pl → nl
   - notes: pl → nl
5. Opslaan in database:
   - Hoofdvelden: Nederlandse vertaling
   - original_* velden: Poolse originelen
   - installer_language: 'pl'
6. Admin ziet: Nederlandse tekst
7. Origineel blijft beschikbaar voor referentie
```

---

## 🧪 Test Scenario's

### Test 1: UI Vertaling voor Poolse Monteur

**Stappen:**
1. Login als monteur met language_preference = 'pl'
2. Open dashboard
3. ✅ **Verwacht:** Alle UI elementen in Pools
4. Check buttons: "Zapisz", "Anuluj", etc.
5. Check menu items: "Projekty", "Zadania", etc.

### Test 2: Project Completion in Pools → Nederlands

**Stappen:**
1. Login als Poolse monteur
2. Open project in mobile app
3. Klik "Project afronden"
4. Vul in (in Pools):
   - Work performed: "Zainstalowano nowe okna PCV"
   - Materials: "Okna PCV, silikon, uszczelki"
   - Notes: "Klient bardzo zadowolony"
5. Submit form
6. ✅ **Verwacht:** Success message in Pools
7. Login als admin (Nederlands)
8. Open project completion
9. ✅ **Verwacht:**
   - Work performed: "Nieuwe PVC ramen geïnstalleerd"
   - Materials: "PVC ramen, silicone, afdichtingen"
   - Notes: "Klant zeer tevreden"
10. Check database
11. ✅ **Verwacht:**
    - `work_performed`: Nederlandse vertaling
    - `original_work_performed`: Poolse origineel
    - `installer_language`: 'pl'

### Test 3: Taal Switchen

**Stappen:**
1. Login als monteur (taal = Pools)
2. UI is in Pools
3. Ga naar settings
4. Wijzig taal naar Engels
5. ✅ **Verwacht:** UI verandert naar Engels
6. Refresh pagina
7. ✅ **Verwacht:** UI blijft Engels

### Test 4: Nederlandse Monteur (No Translation)

**Stappen:**
1. Login als Nederlandse monteur
2. Rond project af in Nederlands
3. ✅ **Verwacht:** Geen vertaling, direct opgeslagen
4. Check database
5. ✅ **Verwacht:**
   - `work_performed`: Nederlandse tekst
   - `original_work_performed`: NULL
   - `installer_language`: 'nl'

---

## 🚀 Deployment

### Stap 1: Database Migratie

```bash
# Run migration
supabase migration up
```

### Stap 2: Deploy Edge Function

```bash
# Deploy translate-ui-texts function
supabase functions deploy translate-ui-texts
```

### Stap 3: Set Environment Variables

```bash
# In Supabase Dashboard > Edge Functions > Configuration
DEEPL_API_KEY=your_deepl_api_key
```

### Stap 4: Frontend Deploy

```bash
# Build and deploy
npm run build
# Deploy to hosting
```

---

## ⚙️ Configuratie

### DeepL API Setup

1. Ga naar https://www.deepl.com/pro-api
2. Maak een gratis account (500k characters/maand)
3. Kopieer API key
4. Voeg toe aan Supabase Edge Functions environment

### Ondersteunde Talen

| Code | Taal | Native Name | UI Support | DeepL Support |
|------|------|-------------|------------|---------------|
| nl | Dutch | Nederlands | ✅ | ✅ |
| en | English | English | ✅ | ✅ |
| pl | Polish | Polski | ✅ | ✅ |
| de | German | Deutsch | ✅ | ✅ |
| fr | French | Français | ✅ | ✅ |
| es | Spanish | Español | ✅ | ✅ |

---

## 🐛 Troubleshooting

### Probleem: UI blijft in Nederlands

**Mogelijke oorzaken:**
1. User language preference niet ingesteld
2. I18nProvider niet in App.tsx
3. Translations niet geladen

**Debug stappen:**
```typescript
// Check user language
const { language } = useI18n();
console.log('Current language:', language);

// Check translation
const { t } = useI18n();
console.log(t('common.save')); // Should be translated
```

### Probleem: Project completion niet vertaald

**Mogelijke oorzaken:**
1. DeepL API key niet geconfigureerd
2. Edge function not deployed
3. User language detection failed

**Debug stappen:**
```sql
-- Check if translations were saved
SELECT 
  work_performed,
  original_work_performed,
  installer_language
FROM project_completions
WHERE installer_language != 'nl';
```

---

## 📊 Monitoring

### Translation Usage

```sql
-- Count translations per language
SELECT 
  installer_language,
  COUNT(*) as completion_count,
  COUNT(original_work_performed) as translated_count
FROM project_completions
GROUP BY installer_language
ORDER BY completion_count DESC;
```

### Missing Translations

```sql
-- Find UI keys without translations for a language
SELECT 
  t_nl.translation_key,
  t_nl.translated_text as dutch_text
FROM ui_translations t_nl
LEFT JOIN ui_translations t_target 
  ON t_nl.translation_key = t_target.translation_key 
  AND t_target.language_code = 'pl'
WHERE t_nl.language_code = 'nl'
  AND t_target.translation_key IS NULL
LIMIT 50;
```

---

## ✅ Acceptatie Criteria

- [x] I18n service geïmplementeerd met DeepL integratie
- [x] I18nContext provider voor React
- [x] useProjectCompletionTranslation hook
- [x] Edge function voor batch UI vertalingen
- [x] Database migratie voor completion translations
- [x] Auto-detect user language bij login
- [x] Cache system voor translations
- [x] Fallback naar Nederlands bij errors
- [x] Originele tekst bewaren in database
- [ ] Integratie in mobile app components
- [ ] Test coverage
- [ ] Documentatie voor developers

---

**Status:** 🚧 In Development  
**Datum:** {{DATE}}  
**Volgende Stap:** Integreer I18nProvider in App.tsx

