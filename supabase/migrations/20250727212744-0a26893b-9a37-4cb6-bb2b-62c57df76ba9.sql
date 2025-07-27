-- Complete remaining database functions with search_path

CREATE OR REPLACE FUNCTION public.get_available_chat_users(current_user_id uuid)
RETURNS TABLE(id uuid, full_name text, role user_role, is_online boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  current_user_role user_role;
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

CREATE OR REPLACE FUNCTION public.generate_quote_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  current_year TEXT;
  next_number INTEGER;
  quote_number TEXT;
BEGIN
  -- Get current year
  current_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  
  -- Get next sequential number for this year
  SELECT COALESCE(MAX(
    CASE 
      WHEN quote_number ~ ('^OFF-' || current_year || '-[0-9]+$')
      THEN CAST(SUBSTRING(quote_number FROM '[0-9]+$') AS INTEGER)
      ELSE 0
    END
  ), 0) + 1
  INTO next_number
  FROM public.quotes
  WHERE quote_number LIKE ('OFF-' || current_year || '-%');
  
  -- Format as OFF-YYYY-NNNN
  quote_number := 'OFF-' || current_year || '-' || LPAD(next_number::TEXT, 4, '0');
  
  RETURN quote_number;
END;
$function$;

CREATE OR REPLACE FUNCTION public.auto_generate_project_tasks()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Check if quote status changed to approved and has associated project
  IF NEW.status = 'goedgekeurd' AND OLD.status != 'goedgekeurd' THEN
    -- Find associated project
    DECLARE
      project_record RECORD;
    BEGIN
      SELECT * INTO project_record 
      FROM public.projects 
      WHERE quote_id = NEW.id;
      
      IF FOUND THEN
        -- Generate tasks from quote
        PERFORM public.generate_project_tasks_from_quote(project_record.id, NEW.id);
      END IF;
    END;
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_project_status_on_delivery()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Update project status to 'afgerond' when delivery is completed
  UPDATE public.projects 
  SET 
    status = 'afgerond',
    updated_at = now()
  WHERE id = NEW.project_id;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.start_project(p_project_id uuid, p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Update project status to 'in-uitvoering'
  UPDATE public.projects 
  SET 
    status = 'in-uitvoering',
    updated_at = now()
  WHERE id = p_project_id;
  
  -- You could add logging or notifications here
END;
$function$;