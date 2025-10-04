# 🔍 DEBUG: Waarom zie je geen vertaling?

## ✅ DATABASE CHECK (al aanwezig)
De `direct_messages` tabel heeft al:
- ✅ `original_language` kolom
- ✅ `translated_content` JSONB kolom

## ❌ MOGELIJKE PROBLEMEN:

### 1. DeepL API Key ontbreekt
**CHECK:**
- Ga naar Supabase → `Settings` → `Edge Functions` → `Secrets`
- Is `DEEPL_API_KEY` toegevoegd? ❌

**FIX:**
1. Ga naar https://www.deepl.com/pro-api
2. Maak gratis account (500k chars/maand)
3. Kopieer API key
4. Voeg toe in Supabase Secrets: `DEEPL_API_KEY=xxx`

### 2. Edge Function niet deployed
**CHECK:**
- Ga naar Supabase → `Edge Functions`
- Zie je `translate-message`? ❌

**FIX:**
Edge function wordt automatisch deployed via Lovable, MAAR:
- Check Lovable deployment logs
- Of manual deploy: `supabase functions deploy translate-message`

### 3. Console errors?
**CHECK IN BROWSER:**
Open DevTools (F12) en kijk naar:
```
🌍 Translating from nl to pl
❌ Translation error: ...
```

## 🚀 SNELLE TEST ZONDER DEEPL

Als je wilt testen of de LOGIC werkt zonder DeepL API:

### Fallback Modus Activeren:
De edge function heeft al een fallback → als DeepL faalt, gebruikt hij het origineel.

**Test dit:**
1. Stuur bericht als Admin (NL)
2. Open browser console (F12)
3. Zie je: `📤 Sending message to: ...`?
4. Zie je: `🌍 Translating from nl to pl`?
5. Zie je een error daarna?

## 🔧 HANDMATIGE VERIFICATIE

Voer uit in Supabase SQL Editor:
```sql
-- Check of chat_language bestaat
SELECT id, full_name, chat_language 
FROM profiles 
WHERE chat_language IS NOT NULL 
LIMIT 5;

-- Check of er berichten zijn met translated_content
SELECT id, content, original_language, translated_content 
FROM direct_messages 
WHERE translated_content IS NOT NULL 
LIMIT 5;
```

## ✅ VOLGENDE STAPPEN

1. **Voeg DeepL API key toe** (PRIORITEIT 1)
2. **Check edge function deployment**
3. **Test met console open** (F12)
4. **Verstuur bericht en kijk naar logs**

