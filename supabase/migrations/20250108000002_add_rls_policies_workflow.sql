-- =====================================================
-- PLANNING & MONTEUR WORKFLOW - ROW LEVEL SECURITY POLICIES
-- Migration: Add RLS policies for new tables
-- Created: 2025-01-08
-- =====================================================

-- =====================================================
-- 1. PLANNING_PARTICIPANTS RLS POLICIES
-- =====================================================

-- View policy: Users can view participants for planning they can access
CREATE POLICY "Users can view planning participants" 
ON public.planning_participants 
FOR SELECT 
USING (
  -- Users can view if they can view the planning item
  EXISTS (
    SELECT 1 FROM public.planning_items pi
    WHERE pi.id = planning_participants.planning_id
    AND (
      -- Creator can view
      pi.user_id = auth.uid()
      OR
      -- Assigned monteur can view
      pi.assigned_user_id = auth.uid()
      OR
      -- Administrators can view all
      public.get_user_role(auth.uid()) = 'Administrator'
    )
  )
  OR
  -- Participants can view their own participation
  planning_participants.user_id = auth.uid()
);

-- Insert policy: Administrators and planning creators can add participants
CREATE POLICY "Authorized users can add planning participants" 
ON public.planning_participants 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.planning_items pi
    WHERE pi.id = planning_participants.planning_id
    AND (
      -- Planning creator can add participants
      pi.user_id = auth.uid()
      OR
      -- Administrators can add participants
      public.get_user_role(auth.uid()) = 'Administrator'
    )
  )
);

-- Update policy: Can update notification/confirmation status
CREATE POLICY "Users can update their participation status" 
ON public.planning_participants 
FOR UPDATE 
USING (
  -- Users can update their own participation
  planning_participants.user_id = auth.uid()
  OR
  -- Administrators can update any
  public.get_user_role(auth.uid()) = 'Administrator'
  OR
  -- Planning creator can update
  EXISTS (
    SELECT 1 FROM public.planning_items pi
    WHERE pi.id = planning_participants.planning_id
    AND pi.user_id = auth.uid()
  )
);

-- Delete policy: Administrators and planning creators can remove participants
CREATE POLICY "Authorized users can remove planning participants" 
ON public.planning_participants 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.planning_items pi
    WHERE pi.id = planning_participants.planning_id
    AND (
      pi.user_id = auth.uid()
      OR
      public.get_user_role(auth.uid()) = 'Administrator'
    )
  )
);

-- =====================================================
-- 2. WORK_TIME_LOGS RLS POLICIES
-- =====================================================

-- View policy: Users can view their own time logs or all if admin
CREATE POLICY "Users can view work time logs" 
ON public.work_time_logs 
FOR SELECT 
USING (
  -- Installer can view their own logs
  installer_id = auth.uid()
  OR
  -- Project assigned user can view
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = work_time_logs.project_id
    AND p.assigned_user_id = auth.uid()
  )
  OR
  -- Administrators can view all
  public.get_user_role(auth.uid()) IN ('Administrator', 'Administratie', 'Verkoper')
);

-- Insert policy: Installers can create their own time logs
CREATE POLICY "Installers can create work time logs" 
ON public.work_time_logs 
FOR INSERT 
WITH CHECK (
  -- Must be for the current user
  installer_id = auth.uid()
  AND
  -- Must be for a project assigned to them
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = work_time_logs.project_id
    AND p.assigned_user_id = auth.uid()
  )
);

-- Update policy: Installers can update their own active logs
CREATE POLICY "Installers can update their work time logs" 
ON public.work_time_logs 
FOR UPDATE 
USING (
  installer_id = auth.uid()
  OR
  public.get_user_role(auth.uid()) IN ('Administrator', 'Administratie')
)
WITH CHECK (
  installer_id = auth.uid()
  OR
  public.get_user_role(auth.uid()) IN ('Administrator', 'Administratie')
);

-- Delete policy: Only administrators can delete time logs
CREATE POLICY "Only admins can delete work time logs" 
ON public.work_time_logs 
FOR DELETE 
USING (
  public.get_user_role(auth.uid()) IN ('Administrator', 'Administratie')
);

-- =====================================================
-- 3. MATERIAL_USAGE RLS POLICIES
-- =====================================================

-- View policy: Users can view materials for projects they can access
CREATE POLICY "Users can view material usage" 
ON public.material_usage 
FOR SELECT 
USING (
  -- Installer who added it can view
  installer_id = auth.uid()
  OR
  -- Project assigned user can view
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = material_usage.project_id
    AND p.assigned_user_id = auth.uid()
  )
  OR
  -- Administrators can view all
  public.get_user_role(auth.uid()) IN ('Administrator', 'Administratie', 'Verkoper')
);

-- Insert policy: Installers can add materials for their projects
CREATE POLICY "Installers can add material usage" 
ON public.material_usage 
FOR INSERT 
WITH CHECK (
  -- Must be for the current user
  installer_id = auth.uid()
  AND
  -- Must be for a project assigned to them or admin
  (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = material_usage.project_id
      AND p.assigned_user_id = auth.uid()
    )
    OR
    public.get_user_role(auth.uid()) IN ('Administrator', 'Administratie')
  )
);

-- Update policy: Installers can update their material entries
CREATE POLICY "Users can update material usage" 
ON public.material_usage 
FOR UPDATE 
USING (
  installer_id = auth.uid()
  OR
  public.get_user_role(auth.uid()) IN ('Administrator', 'Administratie')
);

-- Delete policy: Installers can delete their material entries (before completion)
CREATE POLICY "Users can delete material usage" 
ON public.material_usage 
FOR DELETE 
USING (
  (
    installer_id = auth.uid()
    AND completion_id IS NULL -- Only if not yet linked to completion
  )
  OR
  public.get_user_role(auth.uid()) IN ('Administrator', 'Administratie')
);

-- =====================================================
-- 4. CUSTOMER_NOTIFICATIONS RLS POLICIES
-- =====================================================

-- View policy: Administrators and related users can view notifications
CREATE POLICY "Authorized users can view customer notifications" 
ON public.customer_notifications 
FOR SELECT 
USING (
  -- Administrators can view all
  public.get_user_role(auth.uid()) IN ('Administrator', 'Administratie', 'Verkoper')
  OR
  -- Users can view notifications for projects/planning they're involved in
  (
    EXISTS (
      SELECT 1 FROM public.planning_items pi
      WHERE pi.id = customer_notifications.planning_id
      AND (pi.user_id = auth.uid() OR pi.assigned_user_id = auth.uid())
    )
    OR
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = customer_notifications.project_id
      AND p.assigned_user_id = auth.uid()
    )
  )
);

-- Insert policy: System and administrators can create notifications
CREATE POLICY "System can create customer notifications" 
ON public.customer_notifications 
FOR INSERT 
WITH CHECK (
  public.get_user_role(auth.uid()) IN ('Administrator', 'Administratie')
  OR
  -- Allow service role (for automated notifications)
  auth.uid() IS NOT NULL
);

-- Update policy: System can update notification status
CREATE POLICY "System can update customer notifications" 
ON public.customer_notifications 
FOR UPDATE 
USING (
  public.get_user_role(auth.uid()) IN ('Administrator', 'Administratie')
  OR
  auth.uid() IS NOT NULL -- Allow for webhook updates
);

-- Delete policy: Only administrators can delete notifications
CREATE POLICY "Only admins can delete customer notifications" 
ON public.customer_notifications 
FOR DELETE 
USING (
  public.get_user_role(auth.uid()) = 'Administrator'
);

-- =====================================================
-- 5. MATERIAL_CATALOG RLS POLICIES
-- =====================================================

-- View policy: All authenticated users can view catalog
CREATE POLICY "All users can view material catalog" 
ON public.material_catalog 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL
  AND is_active = true
);

-- Insert policy: Only administrators can add materials
CREATE POLICY "Only admins can add to material catalog" 
ON public.material_catalog 
FOR INSERT 
WITH CHECK (
  public.get_user_role(auth.uid()) IN ('Administrator', 'Administratie')
);

-- Update policy: Only administrators can update materials
CREATE POLICY "Only admins can update material catalog" 
ON public.material_catalog 
FOR UPDATE 
USING (
  public.get_user_role(auth.uid()) IN ('Administrator', 'Administratie')
);

-- Delete policy: Only administrators can delete materials (should use soft delete)
CREATE POLICY "Only admins can delete from material catalog" 
ON public.material_catalog 
FOR DELETE 
USING (
  public.get_user_role(auth.uid()) = 'Administrator'
);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to check if user is assigned to a planning item
CREATE OR REPLACE FUNCTION is_planning_participant(
  p_planning_id UUID,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.planning_participants
    WHERE planning_id = p_planning_id
    AND user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get total work hours for a project
CREATE OR REPLACE FUNCTION get_project_work_hours(p_project_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  total_minutes INTEGER;
BEGIN
  SELECT COALESCE(SUM(total_duration_minutes), 0)
  INTO total_minutes
  FROM public.work_time_logs
  WHERE project_id = p_project_id
  AND status = 'completed';
  
  RETURN total_minutes / 60.0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get material costs for a project
CREATE OR REPLACE FUNCTION get_project_material_costs(p_project_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  total_cost DECIMAL;
BEGIN
  SELECT COALESCE(SUM(total_price), 0)
  INTO total_cost
  FROM public.material_usage
  WHERE project_id = p_project_id;
  
  RETURN total_cost;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get active work session for user
CREATE OR REPLACE FUNCTION get_active_work_session(p_user_id UUID DEFAULT auth.uid())
RETURNS SETOF public.work_time_logs AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.work_time_logs
  WHERE installer_id = p_user_id
  AND status IN ('active', 'paused')
  AND ended_at IS NULL
  ORDER BY started_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has active work session
CREATE OR REPLACE FUNCTION has_active_work_session(p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.work_time_logs
    WHERE installer_id = p_user_id
    AND status IN ('active', 'paused')
    AND ended_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON FUNCTION get_project_work_hours IS 'Calculate total work hours for a project';
COMMENT ON FUNCTION get_project_material_costs IS 'Calculate total material costs for a project';
COMMENT ON FUNCTION get_active_work_session IS 'Get currently active work session for user';
COMMENT ON FUNCTION has_active_work_session IS 'Check if user has an active work session';

