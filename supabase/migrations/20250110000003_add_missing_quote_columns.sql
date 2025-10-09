-- Add missing columns to quotes table that code is trying to use
-- ================================================================

-- Add user_id if it doesn't exist (for RLS and tracking who created the quote)
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Add project_id if it doesn't exist (different from customer_id migration)
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_quotes_user_id ON quotes(user_id);
CREATE INDEX IF NOT EXISTS idx_quotes_project_id ON quotes(project_id);

-- Add comments
COMMENT ON COLUMN quotes.user_id IS 'User who created/owns this quote (for RLS)';
COMMENT ON COLUMN quotes.project_id IS 'Foreign key to projects table for proper relational linking';

-- Update RLS policies to use user_id
DROP POLICY IF EXISTS "Users can view quotes" ON quotes;
DROP POLICY IF EXISTS "Users can insert quotes" ON quotes;
DROP POLICY IF EXISTS "Users can update quotes" ON quotes;

-- Create comprehensive RLS policies
CREATE POLICY "Users can view quotes"
ON quotes FOR SELECT
USING (
  -- Admins can see all
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'Administrator'
  OR
  -- Users can see their own quotes
  user_id = auth.uid()
  OR
  -- Users can see quotes they created (fallback)
  user_id IS NULL -- Allow viewing quotes without user_id (legacy)
);

CREATE POLICY "Users can insert quotes"
ON quotes FOR INSERT
WITH CHECK (
  -- Must be authenticated
  auth.uid() IS NOT NULL
  AND
  -- user_id must match authenticated user or be NULL
  (user_id = auth.uid() OR user_id IS NULL)
);

CREATE POLICY "Users can update their quotes"
ON quotes FOR UPDATE
USING (
  -- Admins can update all
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'Administrator'
  OR
  -- Users can update their own quotes
  user_id = auth.uid()
  OR
  -- Allow updating quotes without user_id (legacy)
  user_id IS NULL
)
WITH CHECK (
  -- user_id must remain the same or be NULL
  (user_id = auth.uid() OR user_id IS NULL)
);

CREATE POLICY "Users can delete their quotes"
ON quotes FOR DELETE
USING (
  -- Admins can delete all
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'Administrator'
  OR
  -- Users can delete their own quotes
  user_id = auth.uid()
);

