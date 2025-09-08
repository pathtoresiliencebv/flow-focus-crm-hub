-- Update user role to Administrator so they can create/edit everything
UPDATE profiles 
SET role = 'Administrator', updated_at = now()
WHERE email IN (
  SELECT email FROM auth.users WHERE id = '8d5a8659-4669-43c2-b8ea-4b4f0ffad58f'
);