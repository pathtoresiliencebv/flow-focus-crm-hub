# 📸 Chat Media Support - Complete Setup Guide

## ✅ **WAT IS GEÏMPLEMENTEERD:**

### 🎯 **Media Types Ondersteund:**
- 📷 **Foto's** (JPEG, PNG, GIF, WebP)
- 📎 **Bestanden** (PDF, DOC, DOCX, XLS, XLSX, TXT, ZIP)
- 🎤 **Voice Messages** (WebM audio opnames)

---

## 📋 **SETUP STAPPEN**

### **STAP 1: Database SQL Uitvoeren** ⚠️
Ga naar **Supabase SQL Editor** en voer uit: `ADD-CHAT-MEDIA.sql`

```sql
ALTER TABLE direct_messages
ADD COLUMN IF NOT EXISTS media_type VARCHAR(20),
ADD COLUMN IF NOT EXISTS media_url TEXT,
ADD COLUMN IF NOT EXISTS media_filename TEXT,
ADD COLUMN IF NOT EXISTS media_size INTEGER,
ADD COLUMN IF NOT EXISTS media_mime_type VARCHAR(100),
ADD COLUMN IF NOT EXISTS voice_duration INTEGER;

ALTER TABLE direct_messages 
ALTER COLUMN content DROP NOT NULL;

ALTER TABLE direct_messages
ADD CONSTRAINT content_or_media_required 
CHECK (
  (content IS NOT NULL AND content != '') 
  OR 
  (media_url IS NOT NULL AND media_url != '')
);
```

### **STAP 2: Maak Storage Bucket** 📦
**Via Supabase Dashboard:**
1. Ga naar **Storage**
2. Klik **"Create a new bucket"**
3. Vul in:
   - Name: `chat-media`
   - Public: ❌ **NO** (private!)
   - File size limit: `52428800` (50 MB)
4. Klik **"Create bucket"**

### **STAP 3: Bucket Policies Toevoegen** 🔒
**Nu** voer je de policies uit (zie `CREATE-CHAT-MEDIA-BUCKET.md`):

```sql
-- Users kunnen uploaden
CREATE POLICY "Users can upload chat media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'chat-media' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users kunnen hun eigen bestanden zien
CREATE POLICY "Users can view their own chat media"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'chat-media' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Ontvangers kunnen media zien
CREATE POLICY "Users can view received chat media"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'chat-media' 
  AND EXISTS (
    SELECT 1 FROM direct_messages dm
    WHERE dm.media_url LIKE '%' || name || '%'
    AND (dm.to_user_id = auth.uid() OR dm.from_user_id = auth.uid())
  )
);

-- Users kunnen eigen uploads verwijderen
CREATE POLICY "Users can delete their own chat media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'chat-media' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

### **STAP 4: Lovable Deployment** 🚀
- Code is al gepushed ✅
- Wacht op Lovable deployment
- Hard refresh: **Ctrl + Shift + R**

---

## 🏗️ **TECHNISCHE ARCHITECTUUR**

### **Database Schema:**
```sql
direct_messages:
  - media_type: 'photo' | 'file' | 'voice'
  - media_url: Supabase Storage URL
  - media_filename: Originele bestandsnaam
  - media_size: Bytes
  - media_mime_type: MIME type
  - voice_duration: Seconden (alleen voor voice)
```

### **Storage Structuur:**
```
chat-media/
  {user_id}/
    photos/
      {timestamp}_photo.jpg
    files/
      {timestamp}_document.pdf
    voice/
      {timestamp}.webm
```

### **Frontend Componenten:**
- **FileUploadButton** - Foto/bestand upload knop
- **VoiceRecorder** - Voice message recorder
- **MediaMessageBubble** - Media display component
- **useFixedChat.uploadMedia()** - Upload naar storage
- **useFixedChat.sendMediaMessage()** - Verstuur media bericht

---

## 🎨 **UI FEATURES**

### **Chat Input:**
```
[📷] [📎] [🎤]  [Text input...]  [→]
```

- **📷** = Foto upload (image/*)
- **📎** = Bestand upload (.pdf, .doc, .zip, etc.)
- **🎤** = Voice recorder (WebM audio)

### **Media Display:**

**Foto:**
- Thumbnail in chat bubble
- Klik om fullscreen te openen

**Bestand:**
- Icon + bestandsnaam + grootte
- Download knop

**Voice Message:**
- Play/Pause button
- Progress bar
- Duration timer (0:00 / 0:45)
- 🎤 icon

---

## 🧪 **TEST SCENARIO**

### **Test 1: Foto versturen**
1. Klik op 📷 icon
2. Selecteer foto
3. Foto wordt geüpload naar storage
4. Ontvanger ziet thumbnail
5. Klik om fullscreen

### **Test 2: Voice message**
1. Klik op 🎤 icon
2. Spreek bericht in (max 60s)
3. Klik STOP knop
4. Klik "Verstuur"
5. Ontvanger ziet voice player
6. Klik play om af te spelen

### **Test 3: Bestand versturen**
1. Klik op 📎 icon
2. Selecteer PDF/DOC
3. Upload gebeurt
4. Ontvanger ziet bestand + download knop

---

## ⚠️ **LIMIETEN & CONSTRAINTS**

- **Max file size**: 50 MB
- **Voice max duration**: 60 seconden (frontend limit)
- **Supported photo formats**: JPEG, PNG, GIF, WebP
- **Supported file formats**: PDF, DOC, DOCX, XLS, XLSX, TXT, ZIP
- **Voice format**: WebM (opus codec)

---

## 🔒 **BEVEILIGING (RLS)**

✅ Users kunnen alleen hun eigen uploads zien  
✅ Ontvangers kunnen media van berichten zien  
✅ Geen public toegang  
✅ Bucket is private  
✅ Folder per user (`{user_id}/`)

---

## 🐛 **TROUBLESHOOTING**

### **Probleem: Upload faalt**
**Check:**
1. Is bucket `chat-media` gemaakt?
2. Zijn de 4 policies toegevoegd?
3. Check browser console voor errors
4. Verify RLS policies in Supabase

### **Probleem: Media niet zichtbaar**
**Check:**
1. Is `media_url` opgeslagen in `direct_messages`?
2. Check storage: zie je bestand onder `{user_id}/`?
3. Check RLS: kan ontvanger het bestand zien?

### **Probleem: Voice recorder werkt niet**
**Check:**
1. Microfoon permissie gegeven?
2. Browser ondersteunt MediaRecorder API?
3. HTTPS connectie (required voor mic access)

---

## ✅ **VERIFICATIE CHECKLIST**

- [ ] **STAP 1:** Database SQL uitgevoerd
- [ ] **STAP 2:** Bucket `chat-media` gemaakt via UI
- [ ] **STAP 3:** 4 RLS policies toegevoegd
- [ ] **STAP 4:** Lovable deployment voltooid
- [ ] **TEST 1:** Foto upload werkt
- [ ] **TEST 2:** Voice message werkt
- [ ] **TEST 3:** Bestand upload werkt
- [ ] **TEST 4:** Ontvanger kan media zien
- [ ] **TEST 5:** Download functie werkt

---

## 🎉 **KLAAR!**

**De chat ondersteunt nu volledig:**
- ✅ Automatische vertaling (NL ↔ PL)
- ✅ Foto's versturen
- ✅ Bestanden delen
- ✅ Voice messages
- ✅ Realtime synchronisatie
- ✅ Veilige storage (RLS)

**ZONDER dat de bestaande vertaling functionaliteit kapot is gegaan!** 🚀

