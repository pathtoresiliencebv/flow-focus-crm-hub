-- 🔧 CHAT FIX V2 - Vereenvoudigde versie
-- Als de complexe get_available_chat_users niet werkt, gebruik deze simpele versie

-- Drop de oude functie
DROP FUNCTION IF EXISTS public.get_available_chat_users(uuid);

-- Maak een SIMPELE versie die gewoon ALLE andere users teruggeeft
CREATE OR REPLACE FUNCTION public.get_available_chat_users(current_user_id uuid)
RETURNS TABLE(id uuid, full_name text, role text, email text, is_online boolean)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    p.id, 
    COALESCE(p.full_name, p.email) as full_name,
    COALESCE(p.role, 'Unknown') as role,
    p.email,
    COALESCE(p.is_online, false) as is_online
  FROM profiles p
  WHERE p.id != current_user_id
    AND p.email IS NOT NULL
  ORDER BY p.full_name;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_available_chat_users(uuid) TO authenticated;

-- Test de functie (vervang YOUR-USER-ID met je user ID)
-- SELECT * FROM get_available_chat_users('YOUR-USER-ID'::uuid);

