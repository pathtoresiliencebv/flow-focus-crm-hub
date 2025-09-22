-- Create project personnel assignments table
CREATE TABLE public.project_personnel (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  project_role text NOT NULL DEFAULT 'Monteur',
  hourly_rate numeric(10,2) DEFAULT 35.00,
  estimated_hours numeric(10,2) DEFAULT 8.0,
  assigned_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- Enable RLS
ALTER TABLE public.project_personnel ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for project personnel
CREATE POLICY "Users can view project personnel for accessible projects"
ON public.project_personnel
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_personnel.project_id
    AND (
      get_user_role(auth.uid()) IN ('Administrator', 'Administratie')
      OR (get_user_role(auth.uid()) = 'Installateur' AND (p.assigned_user_id = auth.uid() OR p.user_id = auth.uid()))
    )
  )
);

CREATE POLICY "Authorized users can create project personnel"
ON public.project_personnel
FOR INSERT
WITH CHECK (
  assigned_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_personnel.project_id
    AND (
      get_user_role(auth.uid()) IN ('Administrator', 'Administratie')
      OR (get_user_role(auth.uid()) = 'Installateur' AND (p.assigned_user_id = auth.uid() OR p.user_id = auth.uid()))
    )
  )
);

CREATE POLICY "Authorized users can update project personnel"
ON public.project_personnel
FOR UPDATE
USING (
  (assigned_by = auth.uid() OR get_user_role(auth.uid()) IN ('Administrator', 'Administratie'))
  AND EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_personnel.project_id
    AND (
      get_user_role(auth.uid()) IN ('Administrator', 'Administratie')
      OR (get_user_role(auth.uid()) = 'Installateur' AND (p.assigned_user_id = auth.uid() OR p.user_id = auth.uid()))
    )
  )
);

CREATE POLICY "Authorized users can delete project personnel"
ON public.project_personnel
FOR DELETE
USING (
  (assigned_by = auth.uid() OR get_user_role(auth.uid()) IN ('Administrator', 'Administratie'))
  AND EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_personnel.project_id
    AND (
      get_user_role(auth.uid()) IN ('Administrator', 'Administratie')
      OR (get_user_role(auth.uid()) = 'Installateur' AND (p.assigned_user_id = auth.uid() OR p.user_id = auth.uid()))
    )
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_project_personnel_updated_at
BEFORE UPDATE ON public.project_personnel
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_project_personnel_project_id ON public.project_personnel(project_id);
CREATE INDEX idx_project_personnel_user_id ON public.project_personnel(user_id);