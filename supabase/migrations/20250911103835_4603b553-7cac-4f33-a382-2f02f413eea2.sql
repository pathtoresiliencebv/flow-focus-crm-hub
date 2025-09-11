-- Safe update approach - only update existing users

-- Update passwords for existing users
UPDATE auth.users SET encrypted_password = crypt('JourySmansOnderhoud1256!@', gen_salt('bf')) WHERE email = 'joury@smanscrm.nl';
UPDATE auth.users SET encrypted_password = crypt('KikiSmansOnderhoud1256!@', gen_salt('bf')) WHERE email = 'kiki@smanscrm.nl';
UPDATE auth.users SET encrypted_password = crypt('JurgenSmansOnderhoud1256!@', gen_salt('bf')) WHERE email = 'jurgen@smanscrm.nl';
UPDATE auth.users SET encrypted_password = crypt('NickSmansOnderhoud1256!@', gen_salt('bf')) WHERE email = 'nick@smanscrm.nl';
UPDATE auth.users SET encrypted_password = crypt('LukeSmansOnderhoud1256!@', gen_salt('bf')) WHERE email = 'luke@smanscrm.nl';
UPDATE auth.users SET encrypted_password = crypt('AndreSmansOnderhoud1256!@', gen_salt('bf')) WHERE email = 'andre@smanscrm.nl';
UPDATE auth.users SET encrypted_password = crypt('MichalSmansOnderhoud1256!@', gen_salt('bf')) WHERE email = 'michal@smanscrm.nl';
UPDATE auth.users SET encrypted_password = crypt('TomekSmansOnderhoud1256!@', gen_salt('bf')) WHERE email = 'tomek@smanscrm.nl';
UPDATE auth.users SET encrypted_password = crypt('GregoriSmansOnderhoud1256!@', gen_salt('bf')) WHERE email = 'gregori@smanscrm.nl';

-- Update profiles with correct names and roles
UPDATE public.profiles SET full_name = 'Joury', role = 'Administrator' WHERE id = (SELECT id FROM auth.users WHERE email = 'joury@smanscrm.nl');
UPDATE public.profiles SET full_name = 'Kiki', role = 'Administrator' WHERE id = (SELECT id FROM auth.users WHERE email = 'kiki@smanscrm.nl');
UPDATE public.profiles SET full_name = 'Jurgen', role = 'Installateur' WHERE id = (SELECT id FROM auth.users WHERE email = 'jurgen@smanscrm.nl');
UPDATE public.profiles SET full_name = 'Nick', role = 'Installateur' WHERE id = (SELECT id FROM auth.users WHERE email = 'nick@smanscrm.nl');
UPDATE public.profiles SET full_name = 'Luke', role = 'Installateur' WHERE id = (SELECT id FROM auth.users WHERE email = 'luke@smanscrm.nl');
UPDATE public.profiles SET full_name = 'Andre', role = 'Installateur' WHERE id = (SELECT id FROM auth.users WHERE email = 'andre@smanscrm.nl');
UPDATE public.profiles SET full_name = 'Michal', role = 'Installateur' WHERE id = (SELECT id FROM auth.users WHERE email = 'michal@smanscrm.nl');
UPDATE public.profiles SET full_name = 'Tomek', role = 'Installateur' WHERE id = (SELECT id FROM auth.users WHERE email = 'tomek@smanscrm.nl');
UPDATE public.profiles SET full_name = 'Gregori', role = 'Installateur' WHERE id = (SELECT id FROM auth.users WHERE email = 'gregori@smanscrm.nl');