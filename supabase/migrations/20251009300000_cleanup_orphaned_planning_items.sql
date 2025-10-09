-- =====================================================
-- CLEANUP ORPHANED PLANNING ITEMS
-- Purpose: Remove planning items for deleted projects
-- Created: 2025-10-09
-- =====================================================

-- Step 1: Delete planning items that reference non-existent projects
DELETE FROM public.planning_items
WHERE project_id IS NOT NULL
  AND project_id NOT IN (SELECT id FROM public.projects);

-- Step 2: Add foreign key constraint with CASCADE delete
-- First, check if the constraint already exists and drop it if needed
DO $$
BEGIN
  -- Drop existing constraint if it exists (might be without CASCADE)
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_schema = 'public' 
    AND table_name = 'planning_items' 
    AND constraint_name = 'planning_items_project_id_fkey'
  ) THEN
    ALTER TABLE public.planning_items DROP CONSTRAINT planning_items_project_id_fkey;
  END IF;
END $$;

-- Add new foreign key constraint with ON DELETE CASCADE
-- This ensures that when a project is deleted, all related planning items are also deleted
ALTER TABLE public.planning_items
ADD CONSTRAINT planning_items_project_id_fkey
FOREIGN KEY (project_id)
REFERENCES public.projects(id)
ON DELETE CASCADE;

-- Step 3: Add comment for documentation
COMMENT ON CONSTRAINT planning_items_project_id_fkey ON public.planning_items IS 
'Foreign key to projects table with CASCADE delete - when a project is deleted, all related planning items are automatically removed';

-- Step 4: Create index if not exists for better performance
CREATE INDEX IF NOT EXISTS idx_planning_items_project_id_fkey ON public.planning_items(project_id) 
WHERE project_id IS NOT NULL;

