-- Add selected_calendars column to google_calendar_settings
ALTER TABLE public.google_calendar_settings 
ADD COLUMN selected_calendars JSONB DEFAULT '[]'::jsonb;

-- Add planning_items table for synchronization
CREATE TABLE IF NOT EXISTS public.planning_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  google_event_id TEXT,
  calendar_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT DEFAULT 'confirmed'::text,
  attendees JSONB DEFAULT '[]'::jsonb
);

-- Enable RLS on planning_items
ALTER TABLE public.planning_items ENABLE ROW LEVEL SECURITY;

-- Create policies for planning_items
CREATE POLICY "Users can view their own planning items" 
ON public.planning_items 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own planning items" 
ON public.planning_items 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own planning items" 
ON public.planning_items 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own planning items" 
ON public.planning_items 
FOR DELETE 
USING (auth.uid() = user_id);

-- Admins can view all planning items for team management
CREATE POLICY "Admins can view all planning items" 
ON public.planning_items 
FOR SELECT 
USING (get_user_role(auth.uid()) = 'Administrator');

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_planning_items_updated_at
BEFORE UPDATE ON public.planning_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();