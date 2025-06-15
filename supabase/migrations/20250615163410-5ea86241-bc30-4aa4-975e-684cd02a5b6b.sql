
-- Step 1: Demote any existing Administrators to 'Bekijker' to ensure a clean slate.
UPDATE public.profiles
SET role = 'Bekijker'
WHERE role = 'Administrator';

-- Step 2: Promote your current user account to 'Administrator'.
-- The user ID '586a026f-a84c-4fcd-a4f5-e7ec72ba2fc5' corresponds to your logged-in account.
UPDATE public.profiles
SET role = 'Administrator'
WHERE id = '586a026f-a84c-4fcd-a4f5-e7ec72ba2fc5';
