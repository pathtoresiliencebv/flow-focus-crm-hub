-- Create calendar event categories enum
CREATE TYPE calendar_event_category AS ENUM (
  'werk',
  'persoonlijk', 
  'vakantie',
  'meeting',
  'project',
  'reminder',
  'deadline'
);

-- Create privacy level enum
CREATE TYPE calendar_privacy_level AS ENUM (
  'private',
  'shared',
  'public'
);

-- Create recurrence pattern enum
CREATE TYPE calendar_recurrence_pattern AS ENUM (
  'none',
  'daily',
  'weekly',
  'monthly',
  'yearly'
);

-- Create calendar events table
CREATE TABLE public.calendar_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  end_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  is_all_day BOOLEAN NOT NULL DEFAULT false,
  location TEXT,
  category calendar_event_category NOT NULL DEFAULT 'persoonlijk',
  privacy_level calendar_privacy_level NOT NULL DEFAULT 'private',
  color_code TEXT DEFAULT '#3b82f6',
  
  -- Recurrence fields
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  recurrence_pattern calendar_recurrence_pattern DEFAULT 'none',
  recurrence_interval INTEGER DEFAULT 1,
  recurrence_end_date DATE,
  parent_event_id UUID REFERENCES public.calendar_events(id) ON DELETE CASCADE,
  
  -- Integration fields
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  
  -- Reminder settings
  reminder_minutes_before INTEGER[] DEFAULT '{15}',
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own calendar events" 
ON public.calendar_events 
FOR SELECT 
USING (user_id = auth.uid() OR privacy_level IN ('shared', 'public'));

CREATE POLICY "Users can create their own calendar events" 
ON public.calendar_events 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own calendar events" 
ON public.calendar_events 
FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own calendar events" 
ON public.calendar_events 
FOR DELETE 
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all calendar events" 
ON public.calendar_events 
FOR SELECT 
USING (get_user_role(auth.uid()) = 'Administrator');

-- Create calendar event sharing table
CREATE TABLE public.calendar_event_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.calendar_events(id) ON DELETE CASCADE,
  shared_with_user_id UUID NOT NULL,
  permission_level TEXT NOT NULL DEFAULT 'view', -- 'view' or 'edit'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id, shared_with_user_id)
);

-- Enable RLS for sharing table
ALTER TABLE public.calendar_event_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view shares for their events or shared with them" 
ON public.calendar_event_shares 
FOR SELECT 
USING (
  shared_with_user_id = auth.uid() OR 
  event_id IN (SELECT id FROM public.calendar_events WHERE user_id = auth.uid())
);

CREATE POLICY "Event owners can manage shares" 
ON public.calendar_event_shares 
FOR ALL 
USING (event_id IN (SELECT id FROM public.calendar_events WHERE user_id = auth.uid()));

-- Create user calendar settings table
CREATE TABLE public.user_calendar_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  default_view TEXT NOT NULL DEFAULT 'week', -- 'month', 'week', 'day'
  default_reminder_minutes INTEGER NOT NULL DEFAULT 15,
  work_hours_start TIME NOT NULL DEFAULT '09:00:00',
  work_hours_end TIME NOT NULL DEFAULT '17:00:00',
  work_days INTEGER[] NOT NULL DEFAULT '{1,2,3,4,5}', -- Monday=1, Sunday=7
  timezone TEXT NOT NULL DEFAULT 'Europe/Amsterdam',
  show_weekends BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_calendar_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own calendar settings" 
ON public.user_calendar_settings 
FOR ALL 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Create update trigger for calendar events
CREATE TRIGGER update_calendar_events_updated_at
BEFORE UPDATE ON public.calendar_events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create update trigger for calendar settings
CREATE TRIGGER update_calendar_settings_updated_at
BEFORE UPDATE ON public.user_calendar_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_calendar_events_user_date ON public.calendar_events(user_id, start_datetime);
CREATE INDEX idx_calendar_events_date_range ON public.calendar_events(start_datetime, end_datetime);
CREATE INDEX idx_calendar_events_project ON public.calendar_events(project_id) WHERE project_id IS NOT NULL;
CREATE INDEX idx_calendar_events_recurrence ON public.calendar_events(parent_event_id) WHERE parent_event_id IS NOT NULL;