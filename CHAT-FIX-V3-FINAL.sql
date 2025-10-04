-- 🔧 CHAT FIX V3 - FINAL VERSION
-- Profiles table heeft GEEN email column - email zit in auth.users

-- Drop oude functie
DROP FUNCTION IF EXISTS public.get_available_chat_users(uuid);

-- Maak correcte versie die email haalt uit auth.users via JOIN
CREATE OR REPLACE FUNCTION public.get_available_chat_users(current_user_id uuid)
RETURNS TABLE(id uuid, full_name text, role text, email text, is_online boolean)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    p.id, 
    COALESCE(p.full_name, 'Onbekend') as full_name,
    COALESCE(p.role, 'Unknown') as role,
    COALESCE(u.email, 'Geen email') as email,
    COALESCE(p.is_online, false) as is_online
  FROM profiles p
  LEFT JOIN auth.users u ON u.id = p.id
  WHERE p.id != current_user_id
  ORDER BY p.full_name;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_available_chat_users(uuid) TO authenticated;

-- ✅ KLAAR! Refresh nu de chat pagina

