-- Add payment terms and attachments to quotes table
ALTER TABLE quotes 
ADD COLUMN payment_terms JSONB DEFAULT '[]'::jsonb,
ADD COLUMN attachments JSONB DEFAULT '[]'::jsonb;

-- Add payment term tracking to invoices table  
ALTER TABLE invoices
ADD COLUMN payment_term_sequence INTEGER DEFAULT 1,
ADD COLUMN total_payment_terms INTEGER DEFAULT 1,
ADD COLUMN original_quote_total NUMERIC DEFAULT 0;

-- Update invoice generation function to handle payment terms
CREATE OR REPLACE FUNCTION public.generate_invoice_number_with_sequence(base_number text DEFAULT NULL, sequence_num INTEGER DEFAULT 1)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  current_year TEXT;
  next_number INTEGER;
  invoice_number TEXT;
BEGIN
  -- Get current year
  current_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  
  -- If base_number is provided, use it with sequence
  IF base_number IS NOT NULL THEN
    IF sequence_num > 1 THEN
      invoice_number := base_number || '-' || sequence_num;
    ELSE
      invoice_number := base_number;
    END IF;
    RETURN invoice_number;
  END IF;
  
  -- Generate new base number
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
    AND payment_term_sequence = 1;
  
  -- Format as INV-YYYY-NNNN
  invoice_number := 'INV-' || current_year || '-' || LPAD(next_number::TEXT, 4, '0');
  
  RETURN invoice_number;
END;
$function$