-- Simple update approach for existing users and create missing ones

-- Update passwords for existing users
UPDATE auth.users SET encrypted_password = crypt('JourySmansOnderhoud1256!@', gen_salt('bf')) WHERE email = 'joury@smanscrm.nl';
UPDATE auth.users SET encrypted_password = crypt('KikiSmansOnderhoud1256!@', gen_salt('bf')) WHERE email = 'kiki@smanscrm.nl';
UPDATE auth.users SET encrypted_password = crypt('JurgenSmansOnderhoud1256!@', gen_salt('bf')) WHERE email = 'jurgen@smanscrm.nl';
UPDATE auth.users SET encrypted_password = crypt('NickSmansOnderhoud1256!@', gen_salt('bf')) WHERE email = 'nick@smanscrm.nl';
UPDATE auth.users SET encrypted_password = crypt('LukeSmansOnderhoud1256!@', gen_salt('bf')) WHERE email = 'luke@smanscrm.nl';
UPDATE auth.users SET encrypted_password = crypt('AndreSmansOnderhoud1256!@', gen_salt('bf')) WHERE email = 'andre@smanscrm.nl';
UPDATE auth.users SET encrypted_password = crypt('MichalSmansOnderhoud1256!@', gen_salt('bf')) WHERE email = 'michal@smanscrm.nl';
UPDATE auth.users SET encrypted_password = crypt('TomekSmansOnderhoud1256!@', gen_salt('bf')) WHERE email = 'tomek@smanscrm.nl';

-- Update profiles with correct names and roles
UPDATE public.profiles SET full_name = 'Joury', role = 'Administrator' WHERE id = (SELECT id FROM auth.users WHERE email = 'joury@smanscrm.nl');
UPDATE public.profiles SET full_name = 'Kiki', role = 'Administrator' WHERE id = (SELECT id FROM auth.users WHERE email = 'kiki@smanscrm.nl');
UPDATE public.profiles SET full_name = 'Jurgen', role = 'Installateur' WHERE id = (SELECT id FROM auth.users WHERE email = 'jurgen@smanscrm.nl');
UPDATE public.profiles SET full_name = 'Nick', role = 'Installateur' WHERE id = (SELECT id FROM auth.users WHERE email = 'nick@smanscrm.nl');
UPDATE public.profiles SET full_name = 'Luke', role = 'Installateur' WHERE id = (SELECT id FROM auth.users WHERE email = 'luke@smanscrm.nl');
UPDATE public.profiles SET full_name = 'Andre', role = 'Installateur' WHERE id = (SELECT id FROM auth.users WHERE email = 'andre@smanscrm.nl');
UPDATE public.profiles SET full_name = 'Michal', role = 'Installateur' WHERE id = (SELECT id FROM auth.users WHERE email = 'michal@smanscrm.nl');
UPDATE public.profiles SET full_name = 'Tomek', role = 'Installateur' WHERE id = (SELECT id FROM auth.users WHERE email = 'tomek@smanscrm.nl');

-- Create Gregori user (only one missing)
DO $$
DECLARE
  new_user_id UUID;
BEGIN
  -- Check if gregori already exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'gregori@smanscrm.nl') THEN
    new_user_id := gen_random_uuid();
    
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
      new_user_id,
      '00000000-0000-0000-0000-000000000000',
      'gregori@smanscrm.nl',
      crypt('GregoriSmansOnderhoud1256!@', gen_salt('bf')),
      now(),
      '{"provider": "email", "providers": ["email"]}',
      jsonb_build_object('full_name', 'Gregori'),
      false,
      now(),
      now(),
      'authenticated',
      'authenticated'
    );
    
    -- Create profile for Gregori
    INSERT INTO public.profiles (id, full_name, role, status)
    VALUES (new_user_id, 'Gregori', 'Installateur', 'Actief');
  END IF;
END $$;