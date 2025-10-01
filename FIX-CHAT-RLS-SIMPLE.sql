-- 🔧 FIX CHAT RLS - Messages van Monteur naar Admin komen niet aan
-- Het probleem: RLS policies blokkeren mogelijk messages tussen rollen

-- STAP 1: Drop ALLE oude policies
DROP POLICY IF EXISTS "Users can send direct messages" ON public.direct_messages;
DROP POLICY IF EXISTS "Users can view their direct messages" ON public.direct_messages;
DROP POLICY IF EXISTS "Users can update their direct messages" ON public.direct_messages;
DROP POLICY IF EXISTS "Users can view their own messages" ON public.direct_messages;
DROP POLICY IF EXISTS "Users can insert their own messages" ON public.direct_messages;
DROP POLICY IF EXISTS "Users can update their received messages" ON public.direct_messages;
DROP POLICY IF EXISTS "Service role can manage all messages" ON public.direct_messages;
DROP POLICY IF EXISTS "Admins can view all messages" ON public.direct_messages;
DROP POLICY IF EXISTS "Anyone authenticated can insert messages" ON public.direct_messages;
DROP POLICY IF EXISTS "Anyone authenticated can view their messages" ON public.direct_messages;
DROP POLICY IF EXISTS "Anyone authenticated can update their messages" ON public.direct_messages;

-- STAP 2: Maak SUPER SIMPELE policies (geen role checks!)
CREATE POLICY "Enable insert for authenticated users"
ON public.direct_messages
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Enable select for message participants"
ON public.direct_messages
FOR SELECT
TO authenticated
USING (
  auth.uid() = from_user_id 
  OR 
  auth.uid() = to_user_id
);

CREATE POLICY "Enable update for message recipients"
ON public.direct_messages
FOR UPDATE
TO authenticated
USING (
  auth.uid() = from_user_id 
  OR 
  auth.uid() = to_user_id
);

-- STAP 3: Verifieer policies
SELECT 
  policyname,
  cmd,
  permissive,
  roles
FROM pg_policies
WHERE tablename = 'direct_messages'
ORDER BY policyname;

-- ✅ KLAAR! Test nu:
-- 1. Monteur stuurt bericht naar Admin
-- 2. Admin refresh chat
-- 3. Bericht MOET zichtbaar zijn

