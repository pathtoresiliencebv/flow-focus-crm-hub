-- Fix the generate_quote_public_token function to use proper random generation
CREATE OR REPLACE FUNCTION public.generate_quote_public_token()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  token TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    -- Generate a random token using built-in random function
    token := substring(md5(random()::text) from 1 for 8);
    
    -- Check if token already exists
    SELECT EXISTS(SELECT 1 FROM public.quotes WHERE public_token = token) INTO exists;
    
    -- Exit loop if token is unique
    IF NOT exists THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN token;
END;
$function$;

-- Update all quotes without public tokens
UPDATE public.quotes 
SET public_token = (
  SELECT substring(md5(random()::text) from 1 for 8)
)
WHERE public_token IS NULL;