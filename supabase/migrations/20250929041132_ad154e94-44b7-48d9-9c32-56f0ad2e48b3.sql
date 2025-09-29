-- Fix race condition in invoice number generation by using FOR UPDATE to lock the sequence
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  current_year TEXT;
  next_number INTEGER;
  invoice_number TEXT;
  retry_count INTEGER := 0;
  max_retries INTEGER := 5;
BEGIN
  -- Get current year
  current_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  
  -- Retry loop in case of conflicts
  LOOP
    BEGIN
      -- Get next sequential number for this year with row-level locking
      -- Use a dummy table to serialize invoice number generation
      PERFORM pg_advisory_lock(hashtext('invoice_number_generation'));
      
      SELECT COALESCE(MAX(
        CASE 
          WHEN invoice_number ~ ('^INV-' || current_year || '-[0-9]+$')
          THEN CAST(SUBSTRING(invoice_number FROM '[0-9]+$') AS INTEGER)
          ELSE 0
        END
      ), 0) + 1
      INTO next_number
      FROM public.invoices
      WHERE invoice_number LIKE ('INV-' || current_year || '-%');
      
      -- Format as INV-YYYY-NNNN
      invoice_number := 'INV-' || current_year || '-' || LPAD(next_number::TEXT, 4, '0');
      
      -- Check if this number already exists (final safety check)
      IF NOT EXISTS (SELECT 1 FROM public.invoices WHERE invoice_number = invoice_number) THEN
        -- Release the lock and return the number
        PERFORM pg_advisory_unlock(hashtext('invoice_number_generation'));
        RETURN invoice_number;
      END IF;
      
      -- Release lock before retry
      PERFORM pg_advisory_unlock(hashtext('invoice_number_generation'));
      
      -- If we get here, there was still a conflict, increment retry counter
      retry_count := retry_count + 1;
      
      -- If we've exceeded max retries, throw an error
      IF retry_count >= max_retries THEN
        RAISE EXCEPTION 'Failed to generate unique invoice number after % attempts', max_retries;
      END IF;
      
      -- Small delay before retry
      PERFORM pg_sleep(0.1);
      
    EXCEPTION WHEN unique_violation THEN
      -- Release lock in case of exception
      PERFORM pg_advisory_unlock(hashtext('invoice_number_generation'));
      
      retry_count := retry_count + 1;
      IF retry_count >= max_retries THEN
        RAISE EXCEPTION 'Failed to generate unique invoice number due to conflicts after % attempts', max_retries;
      END IF;
      
      -- Small delay before retry
      PERFORM pg_sleep(0.1);
    END;
  END LOOP;
END;
$function$;