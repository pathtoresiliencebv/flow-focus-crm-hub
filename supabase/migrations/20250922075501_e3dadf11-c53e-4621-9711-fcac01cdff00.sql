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

-- Generate unique public tokens for quotes that don't have them
DO $$
DECLARE
    quote_record RECORD;
    new_token TEXT;
    token_exists BOOLEAN;
BEGIN
    FOR quote_record IN 
        SELECT id FROM quotes 
        WHERE public_token IS NULL AND status IN ('sent', 'approved')
    LOOP
        LOOP
            new_token := substr(md5(random()::text || clock_timestamp()::text), 1, 8);
            
            SELECT EXISTS(SELECT 1 FROM quotes WHERE public_token = new_token) INTO token_exists;
            
            IF NOT token_exists THEN
                UPDATE quotes SET public_token = new_token WHERE id = quote_record.id;
                EXIT;
            END IF;
        END LOOP;
    END LOOP;
END $$;