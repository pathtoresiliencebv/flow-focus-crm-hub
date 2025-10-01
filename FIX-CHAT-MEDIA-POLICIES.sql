-- 🔧 FIX: Chat Media Policies (Update/Recreate)
-- Voer dit uit in Supabase SQL Editor

-- STAP 1: Drop oude policies (als ze bestaan)
DROP POLICY IF EXISTS "Users can upload chat media" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own chat media" ON storage.objects;
DROP POLICY IF EXISTS "Users can view received chat media" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own chat media" ON storage.objects;

-- STAP 2: Maak nieuwe policies aan

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

-- STAP 3: Verifieer de policies
SELECT 
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND policyname LIKE '%chat media%'
ORDER BY policyname;

-- ✅ Je zou 4 policies moeten zien:
-- 1. Users can delete their own chat media (DELETE)
-- 2. Users can upload chat media (INSERT)
-- 3. Users can view received chat media (SELECT)
-- 4. Users can view their own chat media (SELECT)

-- STAP 4: Test de bucket
SELECT 
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets 
WHERE name = 'chat-media';

-- ✅ SUCCESS! Policies zijn bijgewerkt

