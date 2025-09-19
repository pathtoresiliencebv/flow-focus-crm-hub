-- Add missing permissions that don't exist yet
INSERT INTO public.role_permissions (role, permission) VALUES 
('Administratie', 'projects_create')
ON CONFLICT (role, permission) DO NOTHING;