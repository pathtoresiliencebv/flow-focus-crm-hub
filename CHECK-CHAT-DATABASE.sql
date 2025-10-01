-- ========================================
-- CHECK CHAT DATABASE SCHEMA
-- ========================================
-- Voer dit uit in Supabase Dashboard > SQL Editor
-- Dit checkt de huidige database structuur voor chat

-- 1. Check welke kolommen de direct_messages tabel heeft
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'direct_messages'
ORDER BY ordinal_position;

-- 2. Check welke foreign keys er zijn
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'direct_messages' 
    AND tc.constraint_type = 'FOREIGN KEY';

-- 3. Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'direct_messages';

-- 4. Check of RLS enabled is
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'direct_messages';

-- 5. Test een simpele insert (commentaar weghalen om te testen)
-- INSERT INTO public.direct_messages (from_user_id, to_user_id, content)
-- VALUES (auth.uid(), auth.uid(), 'Test bericht')
-- RETURNING *;

-- ========================================
-- VERWACHTE RESULTAAT:
-- ✅ Kolommen: id, from_user_id, to_user_id, content, etc.
-- ✅ Foreign keys naar auth.users
-- ✅ RLS policies voor insert/select
-- ✅ RLS moet enabled zijn
-- ========================================

