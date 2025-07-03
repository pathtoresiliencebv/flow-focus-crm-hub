-- Create function to generate sequential quote numbers
CREATE OR REPLACE FUNCTION public.generate_quote_number()
RETURNS text
LANGUAGE plpgsql
AS $function$
DECLARE
  current_year TEXT;
  next_number INTEGER;
  quote_number TEXT;
BEGIN
  -- Get current year
  current_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  
  -- Get next sequential number for this year
  SELECT COALESCE(MAX(
    CASE 
      WHEN quote_number ~ ('^OFF-' || current_year || '-[0-9]+$')
      THEN CAST(SUBSTRING(quote_number FROM '[0-9]+$') AS INTEGER)
      ELSE 0
    END
  ), 0) + 1
  INTO next_number
  FROM public.quotes
  WHERE quote_number LIKE ('OFF-' || current_year || '-%');
  
  -- Format as OFF-YYYY-NNNN
  quote_number := 'OFF-' || current_year || '-' || LPAD(next_number::TEXT, 4, '0');
  
  RETURN quote_number;
END;
$function$;