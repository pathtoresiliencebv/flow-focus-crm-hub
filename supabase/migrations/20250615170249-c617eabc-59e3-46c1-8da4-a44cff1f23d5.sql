
CREATE OR REPLACE FUNCTION public.get_all_user_details()
RETURNS TABLE(id uuid, full_name text, role public.user_role, status public.user_status, email text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Ensure the user is an administrator before returning data
  IF get_user_role(auth.uid()) <> 'Administrator' THEN
    RAISE EXCEPTION 'U heeft geen rechten om gebruikersgegevens op te halen.';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.full_name,
    p.role,
    p.status,
    u.email
  FROM
    profiles p
  JOIN
    auth.users u ON p.id = u.id;
END;
$$;
