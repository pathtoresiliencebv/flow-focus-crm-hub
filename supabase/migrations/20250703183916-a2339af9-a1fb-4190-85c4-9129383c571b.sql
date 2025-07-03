-- Add new permission types to the enum (first step)
ALTER TYPE public.app_permission ADD VALUE 'projects_create';
ALTER TYPE public.app_permission ADD VALUE 'planning_create';