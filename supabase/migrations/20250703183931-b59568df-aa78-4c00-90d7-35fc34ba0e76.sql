-- Add project and planning creation permissions for appropriate roles
INSERT INTO public.role_permissions (role, permission) VALUES
('Administrator', 'projects_create'),
('Administrator', 'planning_create'),
('Verkoper', 'projects_create'),
('Verkoper', 'planning_create'),
('Administratie', 'planning_create');

-- Note: Installateur intentionally does NOT have projects_create or planning_create permissions