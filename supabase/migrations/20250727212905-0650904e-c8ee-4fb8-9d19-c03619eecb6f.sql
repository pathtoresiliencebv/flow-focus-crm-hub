-- Fix function with correct type reference

CREATE OR REPLACE FUNCTION public.get_available_chat_users(current_user_id uuid)
RETURNS TABLE(id uuid, full_name text, role public.user_role, is_online boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  current_user_role public.user_role;
BEGIN
  -- Get current user's role
  SELECT p.role INTO current_user_role FROM public.profiles p WHERE p.id = current_user_id;
  
  -- Return users based on role permissions
  IF current_user_role = 'Installateur' THEN
    -- Installateurs can only chat with Administrator and Administratie
    RETURN QUERY
    SELECT p.id, p.full_name, p.role, p.is_online
    FROM public.profiles p
    WHERE p.role IN ('Administrator', 'Administratie')
      AND p.id != current_user_id
    ORDER BY p.full_name;
  ELSIF current_user_role IN ('Administrator', 'Administratie') THEN
    -- Admin/Administratie can chat with all Installateurs
    RETURN QUERY
    SELECT p.id, p.full_name, p.role, p.is_online
    FROM public.profiles p
    WHERE p.role = 'Installateur'
      AND p.id != current_user_id
    ORDER BY p.full_name;
  ELSE
    -- Other roles get no chat access
    RETURN;
  END IF;
END;
$function$;