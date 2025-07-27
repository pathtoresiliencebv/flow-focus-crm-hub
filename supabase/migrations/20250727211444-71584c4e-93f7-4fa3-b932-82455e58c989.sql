-- Fix Critical Security Issues

-- 1. Enable RLS on bonnetjes table and add policies
ALTER TABLE public.bonnetjes ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for bonnetjes table
CREATE POLICY "Users can view their own bonnetjes"
ON public.bonnetjes
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert their own bonnetjes"
ON public.bonnetjes
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own bonnetjes"
ON public.bonnetjes
FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own bonnetjes"
ON public.bonnetjes
FOR DELETE
USING (auth.uid() IS NOT NULL);

-- 2. Secure all database functions by setting search_path
-- Update existing functions to include SET search_path TO ''

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

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
    -- Generate a random token (8 characters)
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
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_typing_indicators()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  DELETE FROM public.chat_typing_indicators 
  WHERE updated_at < now() - INTERVAL '30 seconds';
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id uuid)
RETURNS user_role
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  user_role public.user_role;
BEGIN
  -- This function runs with the permissions of the user who defined it,
  -- allowing it to securely access the profiles table.
  SELECT role INTO user_role FROM public.profiles WHERE id = p_user_id;
  RETURN user_role;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_email_settings_sync_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, status)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', 'Bekijker', 'Actief');
  RETURN new;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_user_online_status(p_user_id uuid, p_is_online boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  UPDATE public.profiles 
  SET 
    is_online = p_is_online,
    last_seen = CASE WHEN p_is_online THEN now() ELSE last_seen END,
    updated_at = now()
  WHERE id = p_user_id;
END;
$function$;