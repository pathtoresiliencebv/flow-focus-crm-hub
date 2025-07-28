-- Fix the Administrator profile with null full_name
UPDATE profiles 
SET full_name = 'Administrator'
WHERE id = '586a026f-a84c-4fcd-a4f5-e7ec72ba2fc5' AND full_name IS NULL;