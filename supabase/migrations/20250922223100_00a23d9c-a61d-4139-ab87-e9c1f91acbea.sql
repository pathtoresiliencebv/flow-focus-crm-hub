-- Add foreign key constraint to link project_personnel.user_id to profiles.id
ALTER TABLE public.project_personnel 
ADD CONSTRAINT fk_project_personnel_user_id 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;