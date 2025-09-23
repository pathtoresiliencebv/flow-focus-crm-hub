-- STAP 1: Zet joery@smanscrm.nl direct terug naar Administrator
UPDATE public.profiles 
SET role = 'Administrator'::user_role
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'joery@smanscrm.nl'
);

-- STAP 2: Bescherm joery@smanscrm.nl in demote_other_admins functie
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

    -- Demote all other administrators to 'Bekijker', but NEVER touch joery@smanscrm.nl
    UPDATE public.profiles
    SET role = 'Bekijker'
    WHERE role = 'Administrator' 
    AND id <> p_user_id_to_keep
    AND id NOT IN (
      SELECT id FROM auth.users WHERE email = 'joery@smanscrm.nl'
    );
END;
$function$;

-- STAP 3: Bescherm joery@smanscrm.nl in alle rol-wijzigingen
CREATE OR REPLACE FUNCTION public.protect_super_admin()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  super_admin_email TEXT := 'joery@smanscrm.nl';
  user_email TEXT;
BEGIN
  -- Get the email for the user being modified
  SELECT email INTO user_email 
  FROM auth.users 
  WHERE id = COALESCE(NEW.id, OLD.id);
  
  -- Block any role changes for the super admin
  IF user_email = super_admin_email THEN
    -- If this is an update that tries to change the role
    IF TG_OP = 'UPDATE' AND OLD.role <> NEW.role THEN
      RAISE EXCEPTION 'Cannot modify role for super administrator: %', super_admin_email;
    END IF;
    
    -- If this is a delete attempt
    IF TG_OP = 'DELETE' THEN
      RAISE EXCEPTION 'Cannot delete super administrator: %', super_admin_email;
    END IF;
    
    -- For updates, ensure role stays Administrator
    IF TG_OP = 'UPDATE' THEN
      NEW.role := 'Administrator'::user_role;
    END IF;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$function$;

-- STAP 4: Activeer de trigger voor bescherming
DROP TRIGGER IF EXISTS protect_super_admin_trigger ON public.profiles;
CREATE TRIGGER protect_super_admin_trigger
  BEFORE UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_super_admin();

-- STAP 5: Update admin_reset_user_password functie om super admin te beschermen
CREATE OR REPLACE FUNCTION public.admin_reset_user_password(p_user_id uuid, p_new_password text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  target_user_email TEXT;
BEGIN
  -- Only allow Administrators to call this function
  IF public.get_user_role(auth.uid()) <> 'Administrator' THEN
    RAISE EXCEPTION 'Only Administrators can reset user passwords.';
  END IF;
  
  -- Get target user email
  SELECT email INTO target_user_email FROM auth.users WHERE id = p_user_id;
  
  -- Prevent password reset for super admin
  IF target_user_email = 'joery@smanscrm.nl' THEN
    RAISE EXCEPTION 'Cannot reset password for super administrator.';
  END IF;
  
  -- Prevent admin from changing their own password through this function
  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Use the normal password change process for your own password.';
  END IF;
  
  -- Update the user's password in auth.users
  UPDATE auth.users 
  SET encrypted_password = crypt(p_new_password, gen_salt('bf'))
  WHERE id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found.';
  END IF;
END;
$function$;

-- STAP 6: Update delete_user_safely functie om super admin te beschermen
CREATE OR REPLACE FUNCTION public.delete_user_safely(p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  target_user_email TEXT;
BEGIN
  -- Only allow Administrators to call this function
  IF public.get_user_role(auth.uid()) <> 'Administrator' THEN
    RAISE EXCEPTION 'Only Administrators can delete users.';
  END IF;
  
  -- Get target user email
  SELECT email INTO target_user_email FROM auth.users WHERE id = p_user_id;
  
  -- Prevent deletion of super admin
  IF target_user_email = 'joery@smanscrm.nl' THEN
    RAISE EXCEPTION 'Cannot delete super administrator.';
  END IF;
  
  -- Prevent admin from deleting themselves
  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'You cannot delete your own account.';
  END IF;
  
  -- Delete the profile (this will cascade to related data)
  DELETE FROM public.profiles WHERE id = p_user_id;
  
  -- Delete the auth user record
  DELETE FROM auth.users WHERE id = p_user_id;
END;
$function$;