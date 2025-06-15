
-- Create enum for user roles
CREATE TYPE public.user_role AS ENUM (
    'Administrator',
    'Verkoper',
    'Installateur',
    'Administratie',
    'Bekijker'
);

-- Create enum for user status
CREATE TYPE public.user_status AS ENUM (
    'Actief',
    'Inactief'
);

-- Add role and status to profiles table
ALTER TABLE public.profiles
ADD COLUMN role public.user_role DEFAULT 'Bekijker',
ADD COLUMN status public.user_status DEFAULT 'Actief';

-- The trigger and function were created in a migration that has already been run.
-- I need to modify it.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user;

-- Recreate the function to include the role and status
CREATE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET SEARCH_PATH = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, status)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', 'Bekijker', 'Actief');
  RETURN new;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
