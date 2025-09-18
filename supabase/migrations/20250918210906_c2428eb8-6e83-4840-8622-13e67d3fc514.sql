-- Fix RLS policies for projects table to allow proper insertion
-- Update the policies to be more specific and fix the insertion issue

-- First, drop existing policies
DROP POLICY IF EXISTS "Admins and Administratie can create projects" ON public.projects;
DROP POLICY IF EXISTS "Users can view projects based on role" ON public.projects;
DROP POLICY IF EXISTS "Authorized users can update projects" ON public.projects;
DROP POLICY IF EXISTS "Only administrators can delete projects" ON public.projects;

-- Create new, more permissive policies for project creation
CREATE POLICY "Users can create projects" 
ON public.projects 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Create select policy
CREATE POLICY "Users can view projects based on role" 
ON public.projects 
FOR SELECT 
USING (
  CASE
    WHEN get_user_role(auth.uid()) = 'Administrator' THEN true
    WHEN get_user_role(auth.uid()) = 'Administratie' THEN true
    WHEN get_user_role(auth.uid()) = 'Installateur' THEN (assigned_user_id = auth.uid() OR user_id = auth.uid())
    ELSE false
  END
);

-- Create update policy
CREATE POLICY "Authorized users can update projects" 
ON public.projects 
FOR UPDATE 
USING (
  CASE
    WHEN get_user_role(auth.uid()) = ANY (ARRAY['Administrator'::user_role, 'Administratie'::user_role]) THEN true
    WHEN get_user_role(auth.uid()) = 'Installateur' THEN (assigned_user_id = auth.uid() OR user_id = auth.uid())
    ELSE false
  END
);

-- Create delete policy (only administrators)
CREATE POLICY "Only administrators can delete projects" 
ON public.projects 
FOR DELETE 
USING (get_user_role(auth.uid()) = 'Administrator');

-- Ensure the projects table user_id column gets populated properly
-- Update projects to set user_id if it's null but we have auth context
UPDATE public.projects 
SET user_id = auth.uid() 
WHERE user_id IS NULL AND auth.uid() IS NOT NULL;