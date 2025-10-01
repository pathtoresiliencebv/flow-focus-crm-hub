-- Create Google Calendar settings table
CREATE TABLE public.google_calendar_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  user_role user_role NOT NULL,
  calendar_id TEXT NOT NULL,
  calendar_name TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  sync_enabled BOOLEAN NOT NULL DEFAULT true,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, calendar_id)
);

-- Enable Row Level Security
ALTER TABLE public.google_calendar_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own calendar settings" 
ON public.google_calendar_settings 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all calendar settings" 
ON public.google_calendar_settings 
FOR SELECT 
USING (get_user_role(auth.uid()) = 'Administrator');

-- Create external calendar events table
CREATE TABLE public.external_calendar_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  calendar_setting_id UUID NOT NULL REFERENCES public.google_calendar_settings(id) ON DELETE CASCADE,
  external_event_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  attendees JSONB DEFAULT '[]',
  location TEXT,
  status TEXT DEFAULT 'confirmed',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(calendar_setting_id, external_event_id)
);

-- Enable RLS for external events
ALTER TABLE public.external_calendar_events ENABLE ROW LEVEL SECURITY;

-- Create policies for external events
CREATE POLICY "Users can view events from their calendars" 
ON public.external_calendar_events 
FOR SELECT 
USING (
  calendar_setting_id IN (
    SELECT id FROM public.google_calendar_settings 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "System can manage external events" 
ON public.external_calendar_events 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Add google_calendar_event_id to planning_items table for sync tracking
ALTER TABLE public.planning_items 
ADD COLUMN google_calendar_event_id TEXT,
ADD COLUMN last_synced_at TIMESTAMP WITH TIME ZONE;

-- Create function to update calendar settings timestamp
CREATE OR REPLACE FUNCTION public.update_calendar_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for calendar settings
CREATE TRIGGER update_calendar_settings_updated_at
BEFORE UPDATE ON public.google_calendar_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_calendar_settings_updated_at();

-- Create trigger for external events
CREATE TRIGGER update_external_events_updated_at
BEFORE UPDATE ON public.external_calendar_events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();