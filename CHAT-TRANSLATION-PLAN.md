# 🌍 Chat Vertaling + File Upload - Implementatie Plan

## 📋 **FEATURES:**

### 1. **Automatische Vertaling**
- User selecteert voorkeurtaal bij chat start
- Berichten worden automatisch vertaald
- Origineel + vertaling opgeslagen
- Admin (NL) ↔ Installateur (PL) vertaling

### 2. **File Upload**
- Afbeeldingen, PDF, documenten
- Opslag in Supabase Storage
- Thumbnails voor afbeeldingen
- Download functionaliteit

---

## 🗄️ **DATABASE SCHEMA:**

```sql
-- 1. User taal voorkeur toevoegen aan profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS chat_language VARCHAR(5) DEFAULT 'nl';

-- 2. Messages table heeft al: original_language, translated_content
-- Aanpassen voor betere structuur:
ALTER TABLE direct_messages
ADD COLUMN IF NOT EXISTS file_url TEXT,
ADD COLUMN IF NOT EXISTS file_name TEXT,
ADD COLUMN IF NOT EXISTS file_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS file_size INTEGER;

-- Index voor snelle queries
CREATE INDEX IF NOT EXISTS idx_messages_file ON direct_messages(file_url) WHERE file_url IS NOT NULL;
```

---

## 🔧 **EDGE FUNCTION: translate-message**

```typescript
// supabase/functions/translate-message/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const { text, from_lang, to_lang } = await req.json()
  
  // DeepL API (of Google Translate)
  const response = await fetch('https://api-free.deepl.com/v2/translate', {
    method: 'POST',
    headers: {
      'Authorization': `DeepL-Auth-Key ${Deno.env.get('DEEPL_API_KEY')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      text: [text],
      source_lang: from_lang.toUpperCase(),
      target_lang: to_lang.toUpperCase()
    })
  })
  
  const data = await response.json()
  return new Response(JSON.stringify({ 
    translated_text: data.translations[0].text 
  }))
})
```

---

## 🎨 **FRONTEND COMPONENTEN:**

### 1. **Language Selector**
```tsx
// src/components/chat/LanguageSelector.tsx
const LanguageSelector = ({ value, onChange }) => {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="nl">🇳🇱 Nederlands</SelectItem>
        <SelectItem value="pl">🇵🇱 Polski</SelectItem>
        <SelectItem value="en">🇬🇧 English</SelectItem>
        <SelectItem value="de">🇩🇪 Deutsch</SelectItem>
      </SelectContent>
    </Select>
  )
}
```

### 2. **File Upload**
```tsx
// src/components/chat/FileUpload.tsx
const FileUpload = ({ onUpload }) => {
  const handleFileSelect = async (file) => {
    const { data, error } = await supabase.storage
      .from('chat-files')
      .upload(`${userId}/${Date.now()}-${file.name}`, file)
    
    if (data) onUpload(data.path)
  }
  
  return <Input type="file" onChange={e => handleFileSelect(e.target.files[0])} />
}
```

### 3. **Message Bubble met Vertaling**
```tsx
// In MessageBubble.tsx
<div>
  {/* Vertaalde text (hoofdweergave) */}
  <p>{message.translated_content?.[userLanguage] || message.content}</p>
  
  {/* Origineel (klein, grijs) */}
  {message.original_language !== userLanguage && (
    <p className="text-xs text-gray-500 mt-1">
      Origineel ({message.original_language}): {message.content}
    </p>
  )}
</div>
```

---

## 🔄 **FLOW:**

### **Bericht Versturen:**
1. User typt bericht in hun taal (bijv. PL)
2. Frontend roept `translate-message` edge function
3. Bericht wordt vertaald naar ontvanger's taal (NL)
4. Opslaan in database:
   - `content`: origineel (PL)
   - `original_language`: 'pl'
   - `translated_content`: { nl: "vertaald", pl: "origineel" }

### **Bericht Ontvangen:**
1. Realtime update ontvangt nieuw bericht
2. Check user's taalvoorkeur
3. Toon vertaalde versie als hoofdtext
4. Toon origineel als kleine tekst eronder

---

## 📁 **SUPABASE STORAGE:**

```sql
-- Storage bucket aanmaken (via Supabase Dashboard)
-- Bucket name: chat-files
-- Public: false
-- File size limit: 10MB

-- RLS Policy voor storage
CREATE POLICY "Users can upload chat files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'chat-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view chat files"
ON storage.objects FOR SELECT
USING (bucket_id = 'chat-files');
```

---

## ✅ **IMPLEMENTATIE STAPPEN:**

1. ✅ Database schema uitbreiden
2. ✅ Edge function voor vertaling
3. ✅ Taal selectie UI
4. ✅ Update sendMessage functie
5. ✅ Update MessageBubble component
6. ✅ File upload implementatie
7. ✅ Storage bucket setup
8. ✅ Testen met NL ↔ PL

---

## 🔑 **DEEPL API KEY:**

Nodig voor productie:
- Gratis tier: 500,000 characters/maand
- Alternatief: Google Cloud Translate
- API key via Supabase Edge Function secrets

**Aanmaken:**
1. DeepL account: https://www.deepl.com/pro-api
2. API key genereren
3. Toevoegen aan Supabase: `supabase secrets set DEEPL_API_KEY=xxx`

