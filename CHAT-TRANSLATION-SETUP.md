# 🌍 Chat Translation Setup - Stap voor Stap

## ✅ WAT IS KLAAR
- ✅ Database schema uitgebreid met `chat_language` kolom
- ✅ Edge function `translate-message` gemaakt met DeepL API
- ✅ Language selector UI component
- ✅ useFixedChat hook updated met automatische vertaling
- ✅ MessageBubble toont vertaalde berichten met 🌍 indicator
- ✅ SimpleChatPage met taal selector

## 📋 WAT JIJ MOET DOEN

### STAP 1: Database SQL Uitvoeren
Ga naar **Supabase SQL Editor** en voer uit:
```sql
-- Bestand: ADD-CHAT-LANGUAGE.sql
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS chat_language VARCHAR(5) DEFAULT 'nl';

UPDATE profiles SET chat_language = 'nl' WHERE chat_language IS NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_chat_language ON profiles(chat_language);
```

### STAP 2: DeepL API Key Toevoegen
Ga naar **Supabase Edge Functions Secrets** en voeg toe:
```
DEEPL_API_KEY=jouw-deepl-api-key-hier
```

#### DeepL API Key krijgen:
1. Ga naar: https://www.deepl.com/pro-api
2. Registreer voor **DeepL API Free** (500.000 characters/maand gratis)
3. Kopieer je API key
4. Voeg toe in Supabase: `Settings > Edge Functions > Add new secret`

### STAP 3: Edge Function Deployen
In Supabase Dashboard:
```bash
# Deploy the translate-message edge function
# Dit gebeurt automatisch via Lovable deployment
```

### STAP 4: Database Kolom Toevoegen aan Migratie (OPTIONEEL)
Maak een nieuwe migratie:
```sql
-- supabase/migrations/20251001_add_chat_language.sql
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS chat_language VARCHAR(5) DEFAULT 'nl';

ALTER TABLE direct_messages
ADD COLUMN IF NOT EXISTS translated_content JSONB;

CREATE INDEX IF NOT EXISTS idx_profiles_chat_language ON profiles(chat_language);
```

## 🎯 HOE HET WERKT

### Voor de Admin (NL):
1. Selecteert taal: **Nederlands** 🇳🇱
2. Stuurt bericht: "Hallo, hoe gaat het?"
3. Systeem detecteert Monteur heeft **Polski** ingesteld
4. Automatisch vertalen naar: "Cześć, jak się masz?"
5. Opslaan in database met beide talen

### Voor de Monteur (PL):
1. Selecteert taal: **Polski** 🇵🇱
2. Ontvangt bericht in **Polski**: "Cześć, jak się masz?"
3. Ziet 🌍 indicator = vertaald bericht
4. Stuurt terug: "Dobrze, dziękuję!"
5. Admin ontvangt in **Nederlands**: "Goed, dank je!"

## 🔧 ONDERSTEUNDE TALEN
- 🇳🇱 Nederlands (nl)
- 🇵🇱 Polski (pl)
- 🇬🇧 English (en)
- 🇩🇪 Deutsch (de)
- 🇫🇷 Français (fr)
- 🇪🇸 Español (es)

## 🚀 DEPLOYMENT CHECKLIST

- [ ] **STAP 1:** SQL uitgevoerd in Supabase
- [ ] **STAP 2:** DeepL API Key toegevoegd
- [ ] **STAP 3:** Code gepushed naar main (✅ DONE)
- [ ] **STAP 4:** Lovable deployment voltooid
- [ ] **TEST:** Admin stuurt NL → Monteur ontvangt PL
- [ ] **TEST:** Monteur stuurt PL → Admin ontvangt NL
- [ ] **TEST:** 🌍 indicator verschijnt bij vertaalde berichten

## 📊 DATABASE STRUCTUUR

### profiles table:
```sql
chat_language VARCHAR(5) DEFAULT 'nl'  -- User's preferred chat language
```

### direct_messages table:
```sql
original_language VARCHAR(5)           -- Language message was written in
translated_content JSONB               -- { "nl": "...", "pl": "..." }
```

## 🐛 TROUBLESHOOTING

### Probleem: Vertaling werkt niet
**Oplossing:**
1. Check DeepL API key: `Settings > Edge Functions > Secrets`
2. Check edge function logs: `Edge Functions > translate-message > Logs`
3. Check console: "🌍 Translating from X to Y"

### Probleem: Taal selector niet zichtbaar
**Oplossing:**
1. Hard refresh: `Ctrl + Shift + R`
2. Check deployment: Lovable dashboard
3. Check console voor errors

### Probleem: Database error
**Oplossing:**
1. Voer `ADD-CHAT-LANGUAGE.sql` opnieuw uit
2. Check kolom: `SELECT * FROM profiles LIMIT 1;`
3. Check `chat_language` kolom bestaat

## ✅ VOLGENDE STAPPEN (NA DEPLOYMENT)

1. **Test de vertaling:**
   - Login als Admin (NL)
   - Login als Monteur (PL) in incognito
   - Verstuur berichten heen en weer
   - Check 🌍 indicator

2. **Controleer DeepL gebruik:**
   - DeepL dashboard: https://www.deepl.com/pro-account/usage
   - Check character count
   - 500k characters/maand free tier

3. **Monitor performance:**
   - Edge function response times
   - Translation errors in logs
   - User feedback

## 💡 TIPS

- **Fallback:** Als vertaling faalt, toont systeem origineel bericht
- **Cache:** Vertalingen worden opgeslagen in `translated_content`
- **Kosten:** DeepL Free tier = 500k chars/maand (~25k berichten)
- **Latency:** Vertaling duurt ~500ms extra per bericht

---

**🎉 KLAAR! Nu kan Admin in NL chatten met Monteur in PL!**

