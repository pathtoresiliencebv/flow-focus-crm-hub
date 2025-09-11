-- Enable pgcrypto extension for gen_random_bytes function
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Update the generate_quote_public_token function to be more robust
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
    -- Generate a random token (8 characters) using gen_random_bytes
    token := encode(gen_random_bytes(6), 'base64');
    token := replace(replace(replace(token, '+', ''), '/', ''), '=', '');
    token := lower(token);
    
    -- Check if token already exists
    SELECT EXISTS(SELECT 1 FROM public.quotes WHERE public_token = token) INTO exists;
    
    -- Exit loop if token is unique
    IF NOT exists THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN token;
END;
$function$