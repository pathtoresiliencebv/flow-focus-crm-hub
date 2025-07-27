-- Continue fixing remaining database functions with search_path

CREATE OR REPLACE FUNCTION public.update_role_permissions(p_role user_role, p_permissions app_permission[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
    -- This function can only be executed by an Administrator.
    IF public.get_user_role(auth.uid()) <> 'Administrator' THEN
        RAISE EXCEPTION 'Only Administrators can update role permissions.';
    END IF;

    -- Start by deleting all existing permissions for the specified role.
    DELETE FROM public.role_permissions WHERE role = p_role;
    
    -- Insert the new set of permissions from the provided array.
    IF array_length(p_permissions, 1) > 0 THEN
        INSERT INTO public.role_permissions (role, permission)
        SELECT p_role, unnest(p_permissions);
    END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.demote_other_admins(p_user_id_to_keep uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
    -- This function can only be executed by an Administrator.
    IF public.get_user_role(auth.uid()) <> 'Administrator' THEN
        RAISE EXCEPTION 'Only Administrators can perform this action.';
    END IF;

    -- Demote all other administrators to 'Bekijker'
    UPDATE public.profiles
    SET role = 'Bekijker'
    WHERE role = 'Administrator' AND id <> p_user_id_to_keep;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  current_year TEXT;
  next_number INTEGER;
  invoice_number TEXT;
BEGIN
  -- Get current year
  current_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  
  -- Get next sequential number for this year
  SELECT COALESCE(MAX(
    CASE 
      WHEN invoice_number ~ ('^INV-' || current_year || '-[0-9]+$')
      THEN CAST(SUBSTRING(invoice_number FROM '[0-9]+$') AS INTEGER)
      ELSE 0
    END
  ), 0) + 1
  INTO next_number
  FROM public.invoices
  WHERE invoice_number LIKE ('INV-' || current_year || '-%');
  
  -- Format as INV-YYYY-NNNN
  invoice_number := 'INV-' || current_year || '-' || LPAD(next_number::TEXT, 4, '0');
  
  RETURN invoice_number;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_work_order_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  current_year TEXT;
  next_number INTEGER;
  work_order_number TEXT;
BEGIN
  -- Get current year
  current_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  
  -- Get next sequential number for this year
  SELECT COALESCE(MAX(
    CASE 
      WHEN work_order_number ~ ('^WO-' || current_year || '-[0-9]+$')
      THEN CAST(SUBSTRING(work_order_number FROM '[0-9]+$') AS INTEGER)
      ELSE 0
    END
  ), 0) + 1
  INTO next_number
  FROM public.project_work_orders
  WHERE work_order_number LIKE ('WO-' || current_year || '-%');
  
  -- Format as WO-YYYY-NNNN
  work_order_number := 'WO-' || current_year || '-' || LPAD(next_number::TEXT, 4, '0');
  
  RETURN work_order_number;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_all_user_details()
RETURNS TABLE(id uuid, full_name text, role user_role, status user_status, email text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
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
    u.email::text  -- Cast email to text to match return type
  FROM
    profiles p
  JOIN
    auth.users u ON p.id = u.id;
END;
$function$;