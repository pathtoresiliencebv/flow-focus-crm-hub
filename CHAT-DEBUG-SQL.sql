-- 🔍 CHAT DEBUG SQL
-- Voer dit uit om te zien WAAROM geen gesprekken worden geladen

-- STAP 1: Check of profiles table users heeft
SELECT 
  id, 
  email, 
  full_name, 
  role,
  is_online,
  created_at
FROM profiles
ORDER BY created_at DESC
LIMIT 10;

-- STAP 2: Test get_available_chat_users voor JOUW user ID
-- VERVANG 'YOUR-USER-ID-HERE' met je eigen user ID (zie stap 1)
SELECT * FROM get_available_chat_users('YOUR-USER-ID-HERE'::uuid);

-- STAP 3: Check of de functie bestaat
SELECT 
  routine_name, 
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_name = 'get_available_chat_users';

-- STAP 4: Check current user (run dit als je ingelogd bent)
SELECT 
  auth.uid() as current_user_id,
  (SELECT role FROM profiles WHERE id = auth.uid()) as current_role;

-- STAP 5: Check direct_messages table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'direct_messages' 
ORDER BY ordinal_position;

-- STAP 6: Simpele test - haal ALLE users op (behalve jezelf)
-- VERVANG 'YOUR-USER-ID-HERE' met je eigen user ID
SELECT 
  id, 
  full_name, 
  role, 
  email, 
  COALESCE(is_online, false) as is_online
FROM profiles 
WHERE id != 'YOUR-USER-ID-HERE'::uuid
ORDER BY full_name;

