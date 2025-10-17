-- Check completion-reports bucket status
SELECT 
  id,
  name,
  public,
  created_at,
  updated_at
FROM storage.buckets 
WHERE name = 'completion-reports';

-- Check recent completion reports
SELECT 
  id,
  name,
  owner_id,
  created_at,
  updated_at,
  metadata
FROM storage.objects 
WHERE bucket_id IN (
  SELECT id FROM storage.buckets WHERE name = 'completion-reports'
)
ORDER BY created_at DESC
LIMIT 10;

-- Check project_work_orders table
SELECT 
  id,
  project_id,
  work_order_number,
  pdf_url,
  created_at
FROM project_work_orders
ORDER BY created_at DESC
LIMIT 10;

-- Check project_completions for status
SELECT 
  id,
  project_id,
  status,
  pdf_url,
  email_sent_at,
  created_at
FROM project_completions
ORDER BY created_at DESC
LIMIT 10;
