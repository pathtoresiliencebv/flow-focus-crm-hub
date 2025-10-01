# 📦 Chat Media Storage - Setup Instructies

## ⚠️ BELANGRIJK: Bucket eerst maken via UI!

De bucket **MOET** eerst via de Supabase UI gemaakt worden voordat je de policies kunt toevoegen.

---

## STAP 1: Maak Bucket via Supabase Dashboard

1. Ga naar **Supabase Dashboard** → **Storage**
2. Klik op **"New bucket"** of **"Create a new bucket"**
3. Vul in:
   - **Name**: `chat-media`
   - **Public**: ❌ **NO** (blijft private!)
   - **File size limit**: `52428800` (50 MB)
   - **Allowed MIME types**: Laat leeg of vul in: `image/*,audio/*,application/pdf`

4. Klik **"Create bucket"**

---

## STAP 2: Voer SQL uit voor Policies

**NU** kun je de policies toevoegen. Voer dit uit in **Supabase SQL Editor**:

```sql
-- Policy 1: Gebruikers kunnen bestanden uploaden
CREATE POLICY "Users can upload chat media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'chat-media' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 2: Gebruikers kunnen hun eigen bestanden bekijken
CREATE POLICY "Users can view their own chat media"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'chat-media' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 3: Ontvangers kunnen media bekijken die naar hen gestuurd is
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

-- Policy 4: Gebruikers kunnen hun eigen uploads verwijderen
CREATE POLICY "Users can delete their own chat media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'chat-media' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

---

## STAP 3: Verifieer de Setup

```sql
-- Check bucket
SELECT * FROM storage.buckets WHERE name = 'chat-media';

-- Check policies
SELECT 
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND policyname LIKE '%chat media%';
```

Je zou **4 policies** moeten zien:
1. ✅ Users can upload chat media (INSERT)
2. ✅ Users can view their own chat media (SELECT)
3. ✅ Users can view received chat media (SELECT)
4. ✅ Users can delete their own chat media (DELETE)

---

## 📁 Folder Structuur

De bucket gebruikt deze structuur:
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

**Elk bestand wordt opgeslagen onder de user_id van de uploader!**

---

## ✅ Klaar!

De bucket is nu klaar voor gebruik. De app zal automatisch:
- ✅ Foto's uploaden naar `{user_id}/photos/`
- ✅ Bestanden uploaden naar `{user_id}/files/`
- ✅ Voice messages uploaden naar `{user_id}/voice/`
- ✅ Toegang verlenen aan de ontvanger via RLS

---

## 🧪 Test Upload

Je kunt testen door:
1. Ga naar Chat
2. Klik op foto icon 📷
3. Selecteer een foto
4. Check Supabase Storage → chat-media

Je zou de foto moeten zien onder: `{jouw-user-id}/photos/`

