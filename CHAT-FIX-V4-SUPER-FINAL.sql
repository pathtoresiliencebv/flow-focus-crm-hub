-- 🔧 CHAT FIX V4 - SUPER FINAL VERSION
-- Fix: role is een ENUM, kan geen 'Unknown' zijn

-- Drop oude functie
DROP FUNCTION IF EXISTS public.get_available_chat_users(uuid);

-- Maak correcte versie ZONDER COALESCE op role (role is required in profiles)
CREATE OR REPLACE FUNCTION public.get_available_chat_users(current_user_id uuid)
RETURNS TABLE(id uuid, full_name text, role text, email text, is_online boolean)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    p.id, 
    COALESCE(p.full_name, 'Onbekend') as full_name,
    p.role::text as role,
    COALESCE(u.email, 'Geen email') as email,
    COALESCE(p.is_online, false) as is_online
  FROM profiles p
  LEFT JOIN auth.users u ON u.id = p.id
  WHERE p.id != current_user_id
    AND p.role IS NOT NULL
  ORDER BY p.full_name;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_available_chat_users(uuid) TO authenticated;

-- ✅ KLAAR! Refresh nu de chat pagina

