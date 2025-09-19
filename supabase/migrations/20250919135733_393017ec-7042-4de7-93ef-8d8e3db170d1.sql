-- Update role permissions to fix missing add buttons and user management access

-- First, add the missing permissions for project creation
INSERT INTO public.role_permissions (role, permission) VALUES 
('Verkoper', 'projects_create'),
('Administratie', 'projects_create');

-- Add customer editing permission for Verkoper
INSERT INTO public.role_permissions (role, permission) VALUES 
('Verkoper', 'customers_edit');

-- Add user viewing permission for Administrator (if not already exists)
INSERT INTO public.role_permissions (role, permission) VALUES 
('Administrator', 'users_view')
ON CONFLICT (role, permission) DO NOTHING;