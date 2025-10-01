-- Add team-based fields to calendar_events table
ALTER TABLE public.calendar_events 
ADD COLUMN assigned_to_role user_role,
ADD COLUMN assigned_to_user uuid,
ADD COLUMN is_team_event boolean DEFAULT false;

-- Add index for better performance on role-based queries
CREATE INDEX idx_calendar_events_assigned_to_role ON public.calendar_events(assigned_to_role);
CREATE INDEX idx_calendar_events_assigned_to_user ON public.calendar_events(assigned_to_user);
CREATE INDEX idx_calendar_events_is_team_event ON public.calendar_events(is_team_event);

-- Update RLS policies to support team-based visibility
DROP POLICY IF EXISTS "Users can view their own calendar events" ON public.calendar_events;
DROP POLICY IF EXISTS "Admins can view all calendar events" ON public.calendar_events;

-- New comprehensive RLS policy for viewing events
CREATE POLICY "Users can view calendar events" ON public.calendar_events
FOR SELECT USING (
  -- Own events
  user_id = auth.uid() OR
  -- Events assigned to user
  assigned_to_user = auth.uid() OR
  -- Team events for user's role
  (is_team_event = true AND assigned_to_role = (SELECT role FROM public.profiles WHERE id = auth.uid())) OR
  -- Public/shared events (existing logic)
  privacy_level = ANY (ARRAY['shared'::calendar_privacy_level, 'public'::calendar_privacy_level]) OR
  -- Admin can see all
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'Administrator'
);