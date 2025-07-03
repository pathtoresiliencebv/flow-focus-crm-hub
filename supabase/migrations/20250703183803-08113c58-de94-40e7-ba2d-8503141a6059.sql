-- Add new permissions for project and planning creation
-- First add the new permission types to the enum
ALTER TYPE public.app_permission ADD VALUE 'projects_create';
ALTER TYPE public.app_permission ADD VALUE 'planning_create';

-- Add project creation permission for roles that should be able to create projects
INSERT INTO public.role_permissions (role, permission) VALUES
('Administrator', 'projects_create'),
('Administrator', 'planning_create'),
('Verkoper', 'projects_create'),
('Verkoper', 'planning_create'),
('Administratie', 'planning_create');

-- Note: Installateur should NOT have projects_create or planning_create permissions