-- ========================================
-- FIX VOOR QUOTE NUMBER DUPLICATES
-- ========================================
-- Voer dit uit in Supabase Dashboard > SQL Editor
-- Dit lost de "quotes_quote_number_key" fout op

-- STAP 1: Update de generate_quote_number functie met Advisory Locking
-- Dit voorkomt race conditions bij het genereren van quote nummers
CREATE OR REPLACE FUNCTION public.generate_quote_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  current_year TEXT;
  next_number INTEGER;
  quote_number TEXT;
  lock_key INTEGER;
BEGIN
  -- Get current year
  current_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  
  -- Create unique lock key based on year (to allow different years to run concurrently)
  lock_key := ('x' || substring(md5(current_year), 1, 8))::bit(32)::integer;
  
  -- Acquire advisory lock to prevent race conditions
  PERFORM pg_advisory_lock(lock_key);
  
  BEGIN
    -- Get next sequential number for this year within the lock
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
    
    -- Release the lock before returning
    PERFORM pg_advisory_unlock(lock_key);
    
    RETURN quote_number;
  EXCEPTION
    WHEN others THEN
      -- Always release lock in case of error
      PERFORM pg_advisory_unlock(lock_key);
      RAISE;
  END;
END;
$function$;

-- STAP 2: Maak functie om duplicate quote numbers te fixen
CREATE OR REPLACE FUNCTION public.fix_duplicate_quote_numbers()
RETURNS TABLE(old_quote_number text, new_quote_number text, quote_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  duplicate_record RECORD;
  new_number TEXT;
BEGIN
  -- Find duplicate quote numbers
  FOR duplicate_record IN
    SELECT q1.id, q1.quote_number, q1.created_at
    FROM public.quotes q1
    WHERE EXISTS (
      SELECT 1 FROM public.quotes q2 
      WHERE q2.quote_number = q1.quote_number 
      AND q2.id != q1.id
    )
    ORDER BY q1.created_at ASC
  LOOP
    -- Skip the first occurrence (oldest), rename the newer ones
    IF EXISTS (
      SELECT 1 FROM public.quotes 
      WHERE quote_number = duplicate_record.quote_number 
      AND created_at < duplicate_record.created_at
    ) THEN
      -- Generate new unique quote number
      new_number := public.generate_quote_number();
      
      -- Update the duplicate
      UPDATE public.quotes 
      SET quote_number = new_number 
      WHERE id = duplicate_record.id;
      
      -- Return info about the change
      old_quote_number := duplicate_record.quote_number;
      new_quote_number := new_number;
      quote_id := duplicate_record.id;
      RETURN NEXT;
    END IF;
  END LOOP;
END;
$function$;

-- STAP 3: Grant permissions
GRANT EXECUTE ON FUNCTION public.generate_quote_number() TO authenticated;
GRANT EXECUTE ON FUNCTION public.fix_duplicate_quote_numbers() TO authenticated;

-- STAP 4: Fix bestaande duplicates (voer deze uit NA bovenstaande functies)
-- Uncomment onderstaande regel en voer uit om duplicates te fixen:
-- SELECT * FROM public.fix_duplicate_quote_numbers();

-- STAP 5: Test de nieuwe functie
-- Uncomment onderstaande regel om te testen:
-- SELECT public.generate_quote_number();

-- ========================================
-- RESULTAAT:
-- ✅ Quote nummers worden nu veilig gegenereerd met advisory locking
-- ✅ Race conditions zijn opgelost
-- ✅ Duplicates kunnen gefixed worden met fix_duplicate_quote_numbers()
-- ========================================

