-- 🔧 FIX CHAT ROLE FILTERING
-- Monteurs mogen alleen chatten met Administrator/Administratie

DROP FUNCTION IF EXISTS public.get_available_chat_users(uuid);

CREATE OR REPLACE FUNCTION public.get_available_chat_users(current_user_id uuid)
RETURNS TABLE(id uuid, full_name text, role text, email text, is_online boolean)
LANGUAGE plpgsql
SECURITY DEFINER
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
    -- ✅ Installateurs kunnen ALLEEN chatten met Administrator en Administratie
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
    -- ✅ Admin/Administratie kunnen chatten met ALLE Installateurs en andere admins
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
    -- ✅ Andere rollen krijgen GEEN chat toegang
    RETURN;
  END IF;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_available_chat_users(uuid) TO authenticated;

-- ✅ KLAAR! Refresh de chat pagina
-- Monteurs zien nu ALLEEN Administrator/Administratie
-- Admin ziet alle Installateurs + andere admins

