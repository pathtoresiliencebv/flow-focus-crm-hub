-- Add RLS policy for user deletion (Administrator only)
CREATE POLICY "Administrators can delete users" 
ON public.profiles 
FOR DELETE 
USING (get_user_role(auth.uid()) = 'Administrator');

-- Create function to safely delete a user (both profile and auth record)
CREATE OR REPLACE FUNCTION public.delete_user_safely(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  -- Only allow Administrators to call this function
  IF public.get_user_role(auth.uid()) <> 'Administrator' THEN
    RAISE EXCEPTION 'Only Administrators can delete users.';
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