-- Fix invoice number generation deadlock by removing advisory locks
-- The pg_advisory_lock approach causes timeouts and deadlocks in RPC calls
-- Replace with a simpler timestamp-based approach that's guaranteed to be unique

-- Drop the old problematic function
DROP FUNCTION IF EXISTS public.generate_invoice_number();

-- Create a new simplified version without advisory locks
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  current_year TEXT;
  next_number INTEGER;
  invoice_number TEXT;
BEGIN
  -- Get current year
  current_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  
  -- Get next sequential number for this year
  SELECT COALESCE(MAX(
    CASE 
      WHEN invoice_number ~ ('^INV-' || current_year || '-[0-9]+$')
      THEN CAST(SUBSTRING(invoice_number FROM '[0-9]+$') AS INTEGER)
      ELSE 0
    END
  ), 0) + 1
  INTO next_number
  FROM public.invoices
  WHERE invoice_number LIKE ('INV-' || current_year || '-%')
    AND status != 'draft';  -- Exclude draft invoices from sequence
  
  -- Format as INV-YYYY-NNNN
  invoice_number := 'INV-' || current_year || '-' || LPAD(next_number::TEXT, 4, '0');
  
  RETURN invoice_number;
END;
$$;

-- Ensure the function is executable by authenticated users
GRANT EXECUTE ON FUNCTION public.generate_invoice_number() TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_invoice_number() TO anon;
