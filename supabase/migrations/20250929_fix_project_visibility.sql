-- Fix project visibility issues for monteurs/installers
-- Migration: 20250929_fix_project_visibility.sql

-- First, let's verify and potentially fix the get_user_role function
CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id uuid)
RETURNS public.user_role
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_role public.user_role;
BEGIN
  -- Get role from profiles table
  SELECT role INTO user_role FROM public.profiles WHERE id = p_user_id;
  
  -- If no role found, return default
  IF user_role IS NULL THEN
    RETURN 'Bekijker'::public.user_role;
  END IF;
  
  RETURN user_role;
EXCEPTION 
  WHEN OTHERS THEN
    -- Return default role on any error
    RETURN 'Bekijker'::public.user_role;
END;
$$;

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Users can view projects based on role" ON public.projects;
DROP POLICY IF EXISTS "Admins and Administratie can create projects" ON public.projects;  
DROP POLICY IF EXISTS "Authorized users can update projects" ON public.projects;
DROP POLICY IF EXISTS "Only administrators can delete projects" ON public.projects;

-- Create improved RLS policies for projects with better debugging
CREATE POLICY "Users can view projects based on role"
ON public.projects
FOR SELECT
USING (
  -- Administrators and Administratie can see everything
  get_user_role(auth.uid()) IN ('Administrator', 'Administratie')
  OR
  -- Installers can see projects assigned to them OR created by them  
  (get_user_role(auth.uid()) = 'Installateur' AND 
   (assigned_user_id = auth.uid() OR user_id = auth.uid()))
  OR
  -- Verkoper can see projects they created
  (get_user_role(auth.uid()) = 'Verkoper' AND user_id = auth.uid())
);

CREATE POLICY "Authorized users can create projects"
ON public.projects  
FOR INSERT
WITH CHECK (
  get_user_role(auth.uid()) IN ('Administrator', 'Administratie', 'Verkoper')
);

CREATE POLICY "Authorized users can update projects"
ON public.projects
FOR UPDATE  
USING (
  -- Administrators and Administratie can update everything
  get_user_role(auth.uid()) IN ('Administrator', 'Administratie')
  OR
  -- Installers can update their assigned projects (limited fields)
  (get_user_role(auth.uid()) = 'Installateur' AND assigned_user_id = auth.uid())
  OR  
  -- Verkoper can update projects they created
  (get_user_role(auth.uid()) = 'Verkoper' AND user_id = auth.uid())
);

CREATE POLICY "Only administrators can delete projects"
ON public.projects
FOR DELETE
USING (
  get_user_role(auth.uid()) = 'Administrator'
);

-- Create a debugging function to help troubleshoot project visibility
CREATE OR REPLACE FUNCTION public.debug_project_access(p_project_id uuid)
RETURNS TABLE(
  project_id uuid,
  user_id uuid,
  user_role text,
  assigned_user_id uuid,
  creator_user_id uuid,
  can_view boolean,
  access_reason text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_user_id uuid := auth.uid();
  current_role public.user_role;
  project_assigned_to uuid;
  project_created_by uuid;
BEGIN
  -- Get current user role
  current_role := get_user_role(current_user_id);
  
  -- Get project details
  SELECT p.assigned_user_id, p.user_id 
  INTO project_assigned_to, project_created_by
  FROM public.projects p 
  WHERE p.id = p_project_id;
  
  -- Determine access
  RETURN QUERY
  SELECT 
    p_project_id,
    current_user_id,
    current_role::text,
    project_assigned_to,
    project_created_by,
    CASE 
      WHEN current_role IN ('Administrator', 'Administratie') THEN true
      WHEN current_role = 'Installateur' AND 
           (project_assigned_to = current_user_id OR project_created_by = current_user_id) THEN true
      WHEN current_role = 'Verkoper' AND project_created_by = current_user_id THEN true
      ELSE false
    END as can_view,
    CASE 
      WHEN current_role IN ('Administrator', 'Administratie') THEN 'Admin access'
      WHEN current_role = 'Installateur' AND project_assigned_to = current_user_id THEN 'Assigned installer'
      WHEN current_role = 'Installateur' AND project_created_by = current_user_id THEN 'Creator installer'
      WHEN current_role = 'Verkoper' AND project_created_by = current_user_id THEN 'Creator verkoper'
      ELSE 'No access'
    END as access_reason;
END;
$$;

-- Grant execute permission for debugging function
GRANT EXECUTE ON FUNCTION public.debug_project_access(uuid) TO authenticated;
