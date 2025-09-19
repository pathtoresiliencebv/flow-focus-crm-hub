-- Add missing permissions for Installateur role
INSERT INTO public.role_permissions (role, permission) 
VALUES 
  ('Installateur', 'customers_edit'),
  ('Installateur', 'projects_create')
ON CONFLICT (role, permission) DO NOTHING;