-- Update Installateur role permissions to remove financial access
-- Remove financial permissions for Installateur role
DELETE FROM public.role_permissions 
WHERE role = 'Installateur' AND permission IN ('invoices_view', 'reports_view', 'planning_create');

-- Add missing permissions that Installateur should have
INSERT INTO public.role_permissions (role, permission) VALUES
('Installateur', 'projects_edit')
ON CONFLICT (role, permission) DO NOTHING;