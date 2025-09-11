-- Create/update all users with correct emails, passwords and roles
-- Improved version that handles existing users properly

-- Function to create or update user with password
CREATE OR REPLACE FUNCTION create_or_update_user_with_password(
  p_email TEXT,
  p_password TEXT,
  p_full_name TEXT,
  p_role user_role
) RETURNS VOID AS $$
DECLARE
  user_id UUID;
  existing_user_id UUID;
  existing_profile_id UUID;
BEGIN
  -- Check if user already exists
  SELECT id INTO existing_user_id FROM auth.users WHERE email = p_email;
  
  IF existing_user_id IS NOT NULL THEN
    -- Update existing user password
    UPDATE auth.users 
    SET encrypted_password = crypt(p_password, gen_salt('bf'))
    WHERE id = existing_user_id;
    
    -- Check if profile exists
    SELECT id INTO existing_profile_id FROM public.profiles WHERE id = existing_user_id;
    
    IF existing_profile_id IS NOT NULL THEN
      -- Update existing profile
      UPDATE public.profiles 
      SET full_name = p_full_name, role = p_role
      WHERE id = existing_user_id;
    ELSE
      -- Create profile for existing user
      INSERT INTO public.profiles (id, full_name, role, status)
      VALUES (existing_user_id, p_full_name, p_role, 'Actief');
    END IF;
    
    user_id := existing_user_id;
  ELSE
    -- Create new user
    user_id := gen_random_uuid();
    
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      created_at,
      updated_at,
      role,
      aud
    ) VALUES (
      user_id,
      '00000000-0000-0000-0000-000000000000',
      p_email,
      crypt(p_password, gen_salt('bf')),
      now(),
      '{"provider": "email", "providers": ["email"]}',
      jsonb_build_object('full_name', p_full_name),
      false,
      now(),
      now(),
      'authenticated',
      'authenticated'
    );
    
    -- Create profile for new user
    INSERT INTO public.profiles (id, full_name, role, status)
    VALUES (user_id, p_full_name, p_role, 'Actief');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update Nick's email domain first if it exists
UPDATE auth.users 
SET email = 'nick@smanscrm.nl' 
WHERE email = 'nick@smansonderhoud.nl';

-- Now create/update all users
SELECT create_or_update_user_with_password('joury@smanscrm.nl', 'JourySmansOnderhoud1256!@', 'Joury', 'Administrator');
SELECT create_or_update_user_with_password('kiki@smanscrm.nl', 'KikiSmansOnderhoud1256!@', 'Kiki', 'Administrator');
SELECT create_or_update_user_with_password('jurgen@smanscrm.nl', 'JurgenSmansOnderhoud1256!@', 'Jurgen', 'Installateur');
SELECT create_or_update_user_with_password('nick@smanscrm.nl', 'NickSmansOnderhoud1256!@', 'Nick', 'Installateur');
SELECT create_or_update_user_with_password('luke@smanscrm.nl', 'LukeSmansOnderhoud1256!@', 'Luke', 'Installateur');
SELECT create_or_update_user_with_password('andre@smanscrm.nl', 'AndreSmansOnderhoud1256!@', 'Andre', 'Installateur');
SELECT create_or_update_user_with_password('michal@smanscrm.nl', 'MichalSmansOnderhoud1256!@', 'Michal', 'Installateur');
SELECT create_or_update_user_with_password('gregori@smanscrm.nl', 'GregoriSmansOnderhoud1256!@', 'Gregori', 'Installateur');
SELECT create_or_update_user_with_password('tomek@smanscrm.nl', 'TomekSmansOnderhoud1256!@', 'Tomek', 'Installateur');

-- Clean up the temporary function
DROP FUNCTION create_or_update_user_with_password(TEXT, TEXT, TEXT, user_role);