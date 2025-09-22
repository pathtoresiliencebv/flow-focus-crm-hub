-- Update all Bekijker roles to Administratie role
-- This will give project creation permissions to current users

UPDATE public.profiles 
SET role = 'Administratie'::user_role 
WHERE role = 'Bekijker'::user_role;