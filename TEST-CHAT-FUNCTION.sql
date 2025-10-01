-- 🔍 TEST CHAT FUNCTION
-- Run dit om te zien wat er mis gaat

-- STAP 1: Check je eigen user ID en role
SELECT 
  auth.uid() as my_user_id,
  (SELECT role FROM profiles WHERE id = auth.uid()) as my_role;

-- STAP 2: Check alle profiles (om te zien wie er beschikbaar zou moeten zijn)
SELECT id, full_name, role, email 
FROM profiles 
ORDER BY role, full_name;

-- STAP 3: Test de functie DIRECT
SELECT * FROM get_available_chat_users(auth.uid());

-- STAP 4: Als STAP 3 een error geeft, probeer dit (met jouw user ID):
-- Vervang 'JOUW-USER-ID' met je echte user ID uit STAP 1
-- SELECT * FROM get_available_chat_users('JOUW-USER-ID'::uuid);

-- STAP 5: Check of de functie bestaat
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'get_available_chat_users';

-- STAP 6: Check RLS policies
SELECT policyname, cmd, permissive 
FROM pg_policies 
WHERE tablename = 'direct_messages';

