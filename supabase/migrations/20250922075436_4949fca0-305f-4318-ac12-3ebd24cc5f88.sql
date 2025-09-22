-- Fix quote status constraint to match application usage
-- The application uses English status values but Dutch display labels

-- First, update existing quotes with old Dutch status values to new English ones
UPDATE quotes 
SET status = CASE 
  WHEN status = 'verstuurd' THEN 'sent'
  WHEN status = 'goedgekeurd' THEN 'approved'
  WHEN status = 'afgewezen' THEN 'rejected'
  WHEN status = 'verlopen' THEN 'expired'
  ELSE status
END 
WHERE status IN ('verstuurd', 'goedgekeurd', 'afgewezen', 'verlopen');

-- Update any invoices that might have old status values too
UPDATE invoices 
SET status = CASE 
  WHEN status = 'verstuurd' THEN 'sent'
  WHEN status = 'verzonden' THEN 'sent'
  WHEN status = 'betaald' THEN 'paid'
  WHEN status = 'achterstallig' THEN 'overdue'
  ELSE status
END 
WHERE status IN ('verstuurd', 'verzonden', 'betaald', 'achterstallig');

-- Ensure all quotes without public_token get one for public access
UPDATE quotes 
SET public_token = (
  SELECT substr(md5(random()::text), 1, 8)
)
WHERE public_token IS NULL AND status IN ('sent', 'approved');