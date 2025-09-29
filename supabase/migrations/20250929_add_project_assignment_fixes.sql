-- Add project assignment fixes and ensure proper data consistency
-- Migration: 20250929_add_project_assignment_fixes.sql

-- Function to properly assign a user to a project
CREATE OR REPLACE FUNCTION public.assign_user_to_project(
  p_project_id uuid,
  p_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_role public.user_role;
  target_user_exists boolean := false;
  project_exists boolean := false;
BEGIN
  -- Check if current user has permission to assign
  current_role := get_user_role(auth.uid());
  
  IF current_role NOT IN ('Administrator', 'Administratie', 'Verkoper') THEN
    RAISE EXCEPTION 'Insufficient permissions to assign users to projects';
  END IF;
  
  -- Verify target user exists and is an installer
  SELECT EXISTS(
    SELECT 1 FROM public.profiles 
    WHERE id = p_user_id AND role IN ('Installateur', 'Administrator')
  ) INTO target_user_exists;
  
  IF NOT target_user_exists THEN
    RAISE EXCEPTION 'Target user does not exist or is not an installer';
  END IF;
  
  -- Verify project exists
  SELECT EXISTS(SELECT 1 FROM public.projects WHERE id = p_project_id) INTO project_exists;
  
  IF NOT project_exists THEN
    RAISE EXCEPTION 'Project does not exist';
  END IF;
  
  -- Update the project assignment
  UPDATE public.projects 
  SET 
    assigned_user_id = p_user_id,
    updated_at = now()
  WHERE id = p_project_id;
  
  -- Also add to project_personnel table if it doesn't exist
  INSERT INTO public.project_personnel (
    project_id,
    user_id,
    project_role,
    assigned_by
  ) VALUES (
    p_project_id,
    p_user_id,
    'Monteur',
    auth.uid()
  )
  ON CONFLICT (project_id, user_id) 
  DO UPDATE SET 
    assigned_by = auth.uid(),
    updated_at = now();
    
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$;

-- Function to get projects for current user with clear role-based filtering
CREATE OR REPLACE FUNCTION public.get_user_projects()
RETURNS TABLE(
  id uuid,
  title text,
  description text,
  customer_id uuid,
  user_id uuid,
  assigned_user_id uuid,
  date text,
  value numeric,
  status text,
  created_at timestamptz,
  updated_at timestamptz,
  customer_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_role public.user_role;
  current_user_id uuid := auth.uid();
BEGIN
  current_role := get_user_role(current_user_id);
  
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.description,
    p.customer_id,
    p.user_id,
    p.assigned_user_id,
    p.date,
    p.value,
    p.status,
    p.created_at,
    p.updated_at,
    COALESCE(c.name, 'Onbekende klant') as customer_name
  FROM public.projects p
  LEFT JOIN public.customers c ON p.customer_id = c.id
  WHERE 
    CASE 
      WHEN current_role IN ('Administrator', 'Administratie') THEN true
      WHEN current_role = 'Installateur' THEN 
        (p.assigned_user_id = current_user_id OR p.user_id = current_user_id)
      WHEN current_role = 'Verkoper' THEN 
        p.user_id = current_user_id
      ELSE false
    END
  ORDER BY p.updated_at DESC;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.assign_user_to_project(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_projects() TO authenticated;

-- Add index for better performance on assigned_user_id lookups
CREATE INDEX IF NOT EXISTS idx_projects_assigned_user_id ON public.projects(assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);

-- Add a trigger to log project assignments for debugging
CREATE OR REPLACE FUNCTION public.log_project_assignment()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Log the assignment change
  IF OLD.assigned_user_id IS DISTINCT FROM NEW.assigned_user_id THEN
    INSERT INTO public.audit_log (
      table_name,
      record_id,
      action,
      old_values,
      new_values,
      user_id
    ) VALUES (
      'projects',
      NEW.id,
      'assignment_changed',
      jsonb_build_object('assigned_user_id', OLD.assigned_user_id),
      jsonb_build_object('assigned_user_id', NEW.assigned_user_id),
      auth.uid()
    );
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Don't fail the update if audit logging fails
    RETURN NEW;
END;
$$;

-- Create trigger (only if audit_log table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_log') THEN
    DROP TRIGGER IF EXISTS trigger_log_project_assignment ON public.projects;
    CREATE TRIGGER trigger_log_project_assignment
      AFTER UPDATE ON public.projects
      FOR EACH ROW
      EXECUTE FUNCTION public.log_project_assignment();
  END IF;
END $$;
