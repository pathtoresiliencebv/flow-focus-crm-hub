-- 🔧 FIX CHAT RLS POLICIES
-- Het probleem kan zijn dat de INSERT policy te strict is

-- STAP 1: Check huidige policies
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'direct_messages';

-- STAP 2: Drop ALLE oude policies
DROP POLICY IF EXISTS "Users can send direct messages" ON public.direct_messages;
DROP POLICY IF EXISTS "Users can view their direct messages" ON public.direct_messages;
DROP POLICY IF EXISTS "Users can update their direct messages" ON public.direct_messages;
DROP POLICY IF EXISTS "Users can view their own messages" ON public.direct_messages;
DROP POLICY IF EXISTS "Users can insert their own messages" ON public.direct_messages;
DROP POLICY IF EXISTS "Users can update their received messages" ON public.direct_messages;
DROP POLICY IF EXISTS "Service role can manage all messages" ON public.direct_messages;
DROP POLICY IF EXISTS "Admins can view all messages" ON public.direct_messages;

-- STAP 3: Maak NIEUWE, SIMPELE policies
CREATE POLICY "Anyone authenticated can insert messages"
ON public.direct_messages
FOR INSERT
TO authenticated
WITH CHECK (from_user_id = auth.uid());

CREATE POLICY "Anyone authenticated can view their messages"
ON public.direct_messages
FOR SELECT
TO authenticated
USING (from_user_id = auth.uid() OR to_user_id = auth.uid());

CREATE POLICY "Anyone authenticated can update their messages"
ON public.direct_messages
FOR UPDATE
TO authenticated
USING (from_user_id = auth.uid() OR to_user_id = auth.uid());

-- STAP 4: Verifieer dat policies correct zijn
SELECT 
  policyname,
  cmd,
  roles,
  with_check::text as with_check_condition
FROM pg_policies
WHERE tablename = 'direct_messages';

-- STAP 5: Test insert (als je ingelogd bent)
-- Vervang JOUW-USER-ID en OTHER-USER-ID
INSERT INTO direct_messages (
  from_user_id,
  to_user_id,
  content,
  is_read,
  original_language
) VALUES (
  auth.uid(),
  'OTHER-USER-ID'::uuid,
  'TEST VIA SQL',
  false,
  'nl'
) RETURNING *;

