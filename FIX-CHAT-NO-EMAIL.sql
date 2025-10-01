-- 🔧 FIX CHAT - ZONDER EMAIL COLUMN
-- Profiles table heeft GEEN email column!

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
      u.email as email,  -- Email komt uit auth.users, NIET profiles
      COALESCE(p.is_online, false) as is_online
    FROM profiles p
    INNER JOIN auth.users u ON u.id = p.id  -- INNER JOIN om users zonder auth te skippen
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
      u.email as email,
      COALESCE(p.is_online, false) as is_online
    FROM profiles p
    INNER JOIN auth.users u ON u.id = p.id
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

-- Test (run als je ingelogd bent):
SELECT * FROM get_available_chat_users(auth.uid());

