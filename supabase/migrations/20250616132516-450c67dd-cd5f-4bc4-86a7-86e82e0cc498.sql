
-- Create planning_items table for user-specific planning
CREATE TABLE public.planning_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  assigned_user_id uuid REFERENCES auth.users NOT NULL,
  project_id text,
  title text NOT NULL,
  description text,
  start_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  location text,
  status text DEFAULT 'Gepland',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on planning_items
ALTER TABLE public.planning_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for planning_items
CREATE POLICY "Users can view their own planning and assigned planning" 
  ON public.planning_items 
  FOR SELECT 
  USING (
    auth.uid() = user_id OR 
    auth.uid() = assigned_user_id OR 
    public.get_user_role(auth.uid()) = 'Administrator'
  );

CREATE POLICY "Users can create planning" 
  ON public.planning_items 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own planning" 
  ON public.planning_items 
  FOR UPDATE 
  USING (
    auth.uid() = user_id OR 
    public.get_user_role(auth.uid()) = 'Administrator'
  );

CREATE POLICY "Users can delete their own planning" 
  ON public.planning_items 
  FOR DELETE 
  USING (
    auth.uid() = user_id OR 
    public.get_user_role(auth.uid()) = 'Administrator'
  );

-- Add item_type to quotes items structure (we'll handle this in the frontend)
-- No DB changes needed for quotes as items are stored as JSONB

-- Add indexes for better performance
CREATE INDEX idx_planning_items_assigned_user_id ON public.planning_items(assigned_user_id);
CREATE INDEX idx_planning_items_start_date ON public.planning_items(start_date);
