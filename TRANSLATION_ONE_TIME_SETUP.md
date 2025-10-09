# ⚠️ TRANSLATION SCRIPTS - ÉÉN KEER SETUP

## 🎯 Belangrijk: Deze scripts ALLEEN bij eerste setup draaien!

De translation extraction en vertaling is **EENMALIG**. Daarna worden vertalingen via de database en DeepL API on-the-fly gedaan.

---

## 📋 One-Time Setup Procedure

### Step 1: Controleer Dependencies

```bash
# Check of dependencies al geïnstalleerd zijn
npm list glob tsx dotenv

# Indien nodig:
npm install
```

### Step 2: Controleer Environment Variables

Zorg dat `.env` bestand bestaat met:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Let op**: `SUPABASE_SERVICE_ROLE_KEY` is **VERPLICHT** voor het seed script!

### Step 3: Run Translation Pipeline (EENMALIG!)

```bash
# Optie A: Alles in één keer (aanbevolen)
npm run translate:all

# Optie B: Stap voor stap
npm run translate:extract   # Extract NL teksten → translations/nl-texts.json
npm run translate:deepl     # Translate → translations/{en,pl,ro,tr}-texts.json  
npm run translate:seed      # Upload → Supabase ui_translations tabel
```

**Verwachte output**:
```
✅ Extracted 847 unique texts from 215 files
✅ Translations written to translations/nl-texts.json

✅ Translated to: en (847 texts)
✅ Translated to: pl (847 texts)
✅ Translated to: ro (847 texts)
✅ Translated to: tr (847 texts)

✅ Successfully seeded 4235 translations (5 languages × 847 texts)
```

### Step 4: Verificatie in Database

```sql
-- Check aantal vertalingen per taal
SELECT language_code, COUNT(*) as count 
FROM ui_translations 
GROUP BY language_code;

-- Verwachte output:
-- nl | 847
-- en | 847
-- pl | 847
-- ro | 847
-- tr | 847

-- Check voorbeelden
SELECT * FROM ui_translations 
WHERE translation_key LIKE 'button_%' 
LIMIT 10;
```

### Step 5: Test in Applicatie

1. Open app in browser
2. Klik op taal selector (naast user menu)
3. Wissel tussen talen
4. Verifieer dat UI teksten veranderen
5. Check browser console voor errors

---

## 🔄 Wanneer opnieuw draaien?

**Alleen in deze gevallen:**

### Scenario 1: Nieuwe Hardcoded Teksten Toegevoegd
Als je nieuwe features hebt gemaakt met hardcoded Nederlandse teksten:

```bash
# Extract alleen nieuwe teksten
npm run translate:extract

# Check wat nieuw is in translations/nl-texts.json
# Dan translate en seed:
npm run translate:deepl
npm run translate:seed
```

### Scenario 2: Taal Toegevoegd
Als je een nieuwe taal wilt toevoegen (bijv. Duits):

1. Update scripts:
```typescript
// In translate-texts-deepl.ts EN seed-translations.ts
const TARGET_LANGUAGES = ['en', 'pl', 'ro', 'tr', 'de']; // ← de toegevoegd
```

2. Run opnieuw:
```bash
npm run translate:deepl  # Vertaalt ook naar 'de'
npm run translate:seed   # Upload nieuwe 'de' vertalingen
```

### Scenario 3: Database Reset
Als je `ui_translations` tabel hebt geleegd:

```bash
# Gewoon opnieuw seeden (translations/*.json bestaan al)
npm run translate:seed
```

---

## ⚠️ Wat NIET te doen

### ❌ DON'T: Scripts continue draaien
```bash
# FOUT - niet doen!
npm run translate:all  # Elke keer bij git pull
npm run translate:all  # Bij elke code wijziging
npm run translate:all  # In CI/CD pipeline
```

**Waarom niet?**:
- DeepL API heeft rate limits en kost geld
- Database krijgt dubbele entries
- Overschrijft handmatige correcties
- Vertraagt development workflow

### ❌ DON'T: Extract script in production
```bash
# FOUT - translation extraction is development-only!
npm run translate:extract  # Draait AST parsing over codebase
```

**Waarom niet?**:
- Parsing is langzaam en memory-intensief
- Niet nodig in production (vertalingen zijn al in DB)
- Kan production app vertragen

---

## ✅ Normale Workflow (NA eerste setup)

Na de one-time setup gebruik je **ALLEEN** de DeepL API via Edge Function:

### In Code
```typescript
// Nieuw component - gewoon useI18n gebruiken
const { t } = useI18n();

// Als translation key niet bestaat in DB:
// → i18n service roept automatisch DeepL Edge Function aan
// → Vertaling wordt in realtime gedaan en gecached
// → Bij volgende keer wordt gecachte versie gebruikt
<Button>{t('button_new_feature', 'Nieuwe Feature')}</Button>
```

### In Database
```sql
-- Handmatige correctie van vertaling? Gewoon UPDATE:
UPDATE ui_translations 
SET translated_text = 'Corrected Translation'
WHERE translation_key = 'some_key' AND language_code = 'en';

-- Nieuwe translation key toevoegen? INSERT:
INSERT INTO ui_translations (translation_key, language_code, translated_text)
VALUES ('custom_key', 'en', 'Custom Text'),
       ('custom_key', 'nl', 'Aangepaste Tekst'),
       ('custom_key', 'pl', 'Niestandardowy Tekst');
```

---

## 📊 Translation Flow Diagram

```
EERSTE SETUP (EENMALIG):
┌────────────────┐
│  Source Code   │ 
│  (*.tsx, *.ts) │
└────────┬───────┘
         │ npm run translate:extract
         ↓
┌────────────────┐
│ nl-texts.json  │ (847 Dutch texts)
└────────┬───────┘
         │ npm run translate:deepl
         ↓
┌────────────────────────────────────────┐
│ en-texts.json, pl-texts.json, etc.    │
└────────┬───────────────────────────────┘
         │ npm run translate:seed
         ↓
┌────────────────┐
│  ui_translations│ (Supabase table)
│  4235 rows     │
└────────────────┘

---

DAARNA (NORMALE GEBRUIK):
┌────────────────┐
│  Component     │
│  t('key', 'fb')│
└────────┬───────┘
         │
         ↓
┌────────────────┐    Cache miss?    ┌──────────────┐
│  i18n Service  │ ─────────────────→ │  DeepL API   │
│  (in-memory    │                    │  (Edge Func) │
│   + IndexedDB) │ ←───────────────── │  + DB cache  │
└────────┬───────┘    New translation └──────────────┘
         │
         ↓
┌────────────────┐
│  Rendered UI   │
└────────────────┘
```

---

## 🎯 TL;DR

1. ✅ Run `npm run translate:all` **ÉÉN KEER** bij first setup
2. ✅ Verifieer in database dat translations er zijn
3. ✅ Test in browser dat talen wisselen werkt
4. ❌ **NOOIT** meer deze scripts draaien tenzij:
   - Je voegt bulk nieuwe features toe (dan extract → translate → seed)
   - Je voegt een nieuwe taal toe (dan alleen translate → seed)
   - Je reset de database (dan alleen seed)
5. ✅ Voor nieuwe teksten: gewoon `t('key', 'fallback')` gebruiken
6. ✅ DeepL API doet on-the-fly vertaling voor nieuwe keys

**Scripts zijn tools voor SEEDING, niet voor RUNTIME!**

---

## 📞 Troubleshooting

### Script faalt met "Missing Supabase credentials"
→ Check `.env` file bestaat en correct is

### Script faalt met "DeepL API error"
→ Check `DEEPL_API_KEY` in Supabase Dashboard → Settings → Secrets

### Script maakt dubbele entries
→ Database heeft UNIQUE constraint, dit zou niet moeten kunnen
→ Als het toch gebeurt: `DELETE FROM ui_translations` en opnieuw seed

### Vertaling niet zichtbaar in app
→ Check browser console: i18n service logs tonen welke translation keys worden opgevraagd
→ Check database: `SELECT * FROM ui_translations WHERE translation_key = 'your_key'`
→ Hard refresh browser (Ctrl+Shift+R)

---

**Remember: Scripts are run ONCE, translations live FOREVER (in DB)!** 🎯

