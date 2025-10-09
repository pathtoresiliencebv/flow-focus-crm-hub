-- Add PDF URL column to quotes table
-- =====================================

-- Add pdf_url column if it doesn't exist
ALTER TABLE public.quotes 
ADD COLUMN IF NOT EXISTS pdf_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.quotes.pdf_url IS 'URL to generated PDF file in Supabase Storage (bucket: documents, path: quotes/)';

-- The RLS policies are already in place for the quotes table
-- Users with proper permissions can read and update these records

