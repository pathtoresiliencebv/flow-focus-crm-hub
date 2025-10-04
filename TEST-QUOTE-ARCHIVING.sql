-- Test Quote Archiving Functionality
-- Run this in Supabase SQL Editor to verify archiving works

-- 1. Check if archiving columns exist
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'quotes'
  AND column_name IN ('is_archived', 'archived_at', 'archived_by')
ORDER BY column_name;

-- 2. Count active vs archived quotes
SELECT 
  is_archived,
  COUNT(*) as quote_count,
  COUNT(*) FILTER (WHERE status = 'concept') as concept_count,
  COUNT(*) FILTER (WHERE status = 'sent') as sent_count,
  COUNT(*) FILTER (WHERE status = 'approved') as approved_count
FROM quotes
GROUP BY is_archived
ORDER BY is_archived;

-- 3. Show recently archived quotes (if any)
SELECT 
  quote_number,
  customer_name,
  status,
  is_archived,
  archived_at,
  created_at
FROM quotes
WHERE is_archived = true
ORDER BY archived_at DESC NULLS LAST
LIMIT 10;

-- 4. Show active quotes
SELECT 
  quote_number,
  customer_name,
  status,
  is_archived,
  created_at
FROM quotes
WHERE is_archived = false OR is_archived IS NULL
ORDER BY created_at DESC
LIMIT 10;

-- 5. Ensure all quotes have is_archived set (not NULL)
UPDATE quotes 
SET is_archived = false 
WHERE is_archived IS NULL;

-- 6. Verify update
SELECT 
  COUNT(*) FILTER (WHERE is_archived IS NULL) as null_count,
  COUNT(*) FILTER (WHERE is_archived = true) as archived_count,
  COUNT(*) FILTER (WHERE is_archived = false) as active_count,
  COUNT(*) as total_count
FROM quotes;

