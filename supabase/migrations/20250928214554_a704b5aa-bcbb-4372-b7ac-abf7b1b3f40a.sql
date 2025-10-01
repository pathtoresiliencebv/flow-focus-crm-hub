-- Fix security warnings by properly updating the function
DROP TRIGGER IF EXISTS update_calendar_settings_updated_at ON public.google_calendar_settings;
DROP FUNCTION IF EXISTS public.update_calendar_settings_updated_at();

-- Recreate function with proper security settings
CREATE OR REPLACE FUNCTION public.update_calendar_settings_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER update_calendar_settings_updated_at
BEFORE UPDATE ON public.google_calendar_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_calendar_settings_updated_at();