-- Confirm kiki@smanscrm.nl account by setting email_confirmed_at
UPDATE auth.users 
SET email_confirmed_at = now() 
WHERE email = 'kiki@smanscrm.nl' AND email_confirmed_at IS NULL;

-- Create function for admin password reset
CREATE OR REPLACE FUNCTION public.admin_reset_user_password(p_user_id uuid, p_new_password text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Only allow Administrators to call this function
  IF public.get_user_role(auth.uid()) <> 'Administrator' THEN
    RAISE EXCEPTION 'Only Administrators can reset user passwords.';
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
$$;