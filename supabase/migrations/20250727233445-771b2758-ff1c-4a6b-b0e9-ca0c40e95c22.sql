-- Fix RLS policies for projects table with correct structure

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Allow authenticated users to view projects" ON public.projects;
DROP POLICY IF EXISTS "Allow authenticated users to insert projects" ON public.projects;
DROP POLICY IF EXISTS "Allow authenticated users to update projects" ON public.projects;
DROP POLICY IF EXISTS "Allow authenticated users to delete projects" ON public.projects;

-- Add proper role-based policies for projects
CREATE POLICY "Users can view projects based on role"
ON public.projects
FOR SELECT
USING (
  CASE 
    WHEN get_user_role(auth.uid()) = 'Administrator' THEN true
    WHEN get_user_role(auth.uid()) = 'Administratie' THEN true
    WHEN get_user_role(auth.uid()) = 'Installateur' THEN 
      -- Installateurs can see projects assigned to them or created by them
      (assigned_user_id = auth.uid() OR user_id = auth.uid())
    ELSE false
  END
);

CREATE POLICY "Admins and Administratie can create projects"
ON public.projects
FOR INSERT
WITH CHECK (
  get_user_role(auth.uid()) IN ('Administrator', 'Administratie')
);

CREATE POLICY "Authorized users can update projects"
ON public.projects
FOR UPDATE
USING (
  CASE 
    WHEN get_user_role(auth.uid()) IN ('Administrator', 'Administratie') THEN true
    WHEN get_user_role(auth.uid()) = 'Installateur' THEN 
      -- Installateurs can update projects assigned to them (limited fields)
      (assigned_user_id = auth.uid() OR user_id = auth.uid())
    ELSE false
  END
);

CREATE POLICY "Only administrators can delete projects"
ON public.projects
FOR DELETE
USING (
  get_user_role(auth.uid()) = 'Administrator'
);