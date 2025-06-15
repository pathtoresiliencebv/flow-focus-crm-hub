
-- This migration ensures that the database schema is correctly set up for user creation.

-- Step 1: Ensure user_role ENUM type exists.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE public.user_role AS ENUM (
            'Administrator',
            'Verkoper',
            'Installateur',
            'Administratie',
            'Bekijker'
        );
    END IF;
END$$;

-- Step 2: Ensure user_status ENUM type exists.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
        CREATE TYPE public.user_status AS ENUM (
            'Actief',
            'Inactief'
        );
    END IF;
END$$;

-- Step 3: Add role and status columns to profiles table if they don't exist.
-- This makes the script runnable even if parts of the schema are already correct.
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS role public.user_role DEFAULT 'Bekijker',
ADD COLUMN IF NOT EXISTS status public.user_status DEFAULT 'Actief';

-- Step 4: Create or replace the function to handle new users.
-- This function is triggered after a new user signs up in Supabase Auth.
-- It creates a corresponding entry in the public.profiles table.
-- Using ON CONFLICT makes it more robust against race conditions or retries.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET SEARCH_PATH = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, status)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', 'Bekijker', 'Actief')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

-- Step 5: Recreate the trigger to ensure it's on the latest version of the function.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

