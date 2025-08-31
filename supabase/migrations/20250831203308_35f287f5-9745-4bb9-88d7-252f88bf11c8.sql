-- Fix the get_all_user_details function to properly call get_user_role with auth.uid()
CREATE OR REPLACE FUNCTION public.get_all_user_details()
 RETURNS TABLE(id uuid, full_name text, role user_role, status user_status, email text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  -- Ensure the user is an administrator before returning data
  -- Use a direct query instead of the problematic get_user_role function call
  IF (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid()) <> 'Administrator' THEN
    RAISE EXCEPTION 'U heeft geen rechten om gebruikersgegevens op te halen.';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.full_name,
    p.role,
    p.status,
    u.email::text  -- Cast email to text to match return type
  FROM
    profiles p
  JOIN
    auth.users u ON p.id = u.id;
END;
$function$