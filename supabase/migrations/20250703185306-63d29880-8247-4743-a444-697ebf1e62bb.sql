-- Allow Administrators to update any profile
CREATE POLICY "Administrators can update any profile" 
ON public.profiles 
FOR UPDATE 
USING (get_user_role(auth.uid()) = 'Administrator'::user_role);