-- =====================================================
-- FIX PUBLIC QUOTE ACCESS
-- Purpose: Allow public access to quotes via public_token
-- Created: 2025-10-09
-- =====================================================

-- Drop existing "public can view quotes" policy if it exists
DROP POLICY IF EXISTS "Public can view quotes with token" ON public.quotes;
DROP POLICY IF EXISTS "Anyone can view public quotes" ON public.quotes;

-- Create policy to allow ANYONE (even anonymous users) to view quotes via public_token
CREATE POLICY "Anyone can view quotes via public_token" 
ON public.quotes 
FOR SELECT 
USING (
  public_token IS NOT NULL 
  AND public_token != ''
);

-- Add comment for documentation
COMMENT ON POLICY "Anyone can view quotes via public_token" ON public.quotes IS 
'Allows public/anonymous access to quotes when accessed via a valid public_token. This enables sharing quotes with clients via URL.';

