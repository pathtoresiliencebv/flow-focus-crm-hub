-- 🔧 COMPLETE CHAT FIX - FINAL VERSION
-- Fix: Gesprekken verdwijnen + Messages niet zichtbaar

-- STAP 1: Ensure get_available_chat_users werkt (met role filtering)
DROP FUNCTION IF EXISTS public.get_available_chat_users(uuid);

CREATE OR REPLACE FUNCTION public.get_available_chat_users(current_user_id uuid)
RETURNS TABLE(id uuid, full_name text, role text, email text, is_online boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_role text;
BEGIN
  -- Get current user's role
  SELECT p.role::text INTO current_user_role 
  FROM profiles p 
  WHERE p.id = current_user_id;
  
  -- Return users based on role permissions
  IF current_user_role = 'Installateur' THEN
    -- Installateurs kunnen ALLEEN chatten met Administrator en Administratie
    RETURN QUERY
    SELECT 
      p.id, 
      COALESCE(p.full_name, 'Onbekend') as full_name,
      p.role::text as role,
      COALESCE(u.email, 'Geen email') as email,
      COALESCE(p.is_online, false) as is_online
    FROM profiles p
    LEFT JOIN auth.users u ON u.id = p.id
    WHERE p.role::text IN ('Administrator', 'Administratie')
      AND p.id != current_user_id
    ORDER BY p.full_name;
    
  ELSIF current_user_role IN ('Administrator', 'Administratie') THEN
    -- Admin/Administratie kunnen chatten met ALLE Installateurs en andere admins
    RETURN QUERY
    SELECT 
      p.id, 
      COALESCE(p.full_name, 'Onbekend') as full_name,
      p.role::text as role,
      COALESCE(u.email, 'Geen email') as email,
      COALESCE(p.is_online, false) as is_online
    FROM profiles p
    LEFT JOIN auth.users u ON u.id = p.id
    WHERE (p.role::text = 'Installateur' OR p.role::text IN ('Administrator', 'Administratie'))
      AND p.id != current_user_id
    ORDER BY p.full_name;
    
  ELSE
    -- Andere rollen krijgen GEEN chat toegang
    RETURN;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_available_chat_users(uuid) TO authenticated;

-- STAP 2: Fix RLS policies (super simpel, geen role checks)
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
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.direct_messages;
DROP POLICY IF EXISTS "Enable select for message participants" ON public.direct_messages;
DROP POLICY IF EXISTS "Enable update for message recipients" ON public.direct_messages;

-- Nieuwe policies (super simpel)
CREATE POLICY "chat_insert_policy"
ON public.direct_messages
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "chat_select_policy"
ON public.direct_messages
FOR SELECT
TO authenticated
USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "chat_update_policy"
ON public.direct_messages
FOR UPDATE
TO authenticated
USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- STAP 3: Verifieer
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'direct_messages';
SELECT * FROM get_available_chat_users(auth.uid());

-- ✅ KLAAR! Refresh chat pagina

