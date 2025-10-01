-- 📦 SUPABASE STORAGE SETUP - Chat Media Bucket
-- Voer dit uit in Supabase SQL Editor

-- STAP 1: Maak chat-media bucket (indien nog niet bestaat)
-- GA NAAR: Supabase Dashboard > Storage > Create bucket
-- Naam: chat-media
-- Public: NO (private bucket)
-- File size limit: 50MB
-- Allowed MIME types: image/*, audio/*, application/pdf, etc.

-- STAP 2: RLS Policies voor chat-media bucket
-- Users kunnen hun eigen uploads zien en uploaden

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
-- Dit vereist een check in de direct_messages tabel
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

-- STAP 3: Verifieer bucket en policies
SELECT * FROM storage.buckets WHERE name = 'chat-media';

-- Check policies (via pg_policies system table)
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND policyname LIKE '%chat media%';

-- ✅ SUCCESS! Storage bucket klaar voor chat media

-- FOLDER STRUCTUUR:
-- chat-media/
--   {user_id}/
--     photos/
--       {timestamp}_{filename}.jpg
--     files/
--       {timestamp}_{filename}.pdf
--     voice/
--       {timestamp}.webm

-- GEBRUIK IN CODE:
-- const filePath = `${userId}/photos/${Date.now()}_${file.name}`;
-- const { data, error } = await supabase.storage
--   .from('chat-media')
--   .upload(filePath, file);

