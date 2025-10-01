-- 🔍 CHECK OF BERICHTEN WORDEN OPGESLAGEN
-- Run dit in Supabase SQL Editor

-- STAP 1: Check of er berichten in de database staan
SELECT 
  id,
  from_user_id,
  to_user_id,
  content,
  created_at,
  is_read
FROM direct_messages
ORDER BY created_at DESC
LIMIT 10;

-- STAP 2: Check de RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'direct_messages';

-- STAP 3: Test INSERT als current user
-- Dit zou moeten werken als je ingelogd bent
INSERT INTO direct_messages (
  from_user_id,
  to_user_id,
  content,
  is_read
) VALUES (
  auth.uid(),
  auth.uid(), -- naar jezelf voor test
  'TEST MESSAGE FROM SQL',
  false
) RETURNING *;

-- STAP 4: Check of de test message verschijnt
SELECT * FROM direct_messages 
WHERE content = 'TEST MESSAGE FROM SQL'
ORDER BY created_at DESC;

