-- Enable pgcrypto extension for proper token generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Update existing quotes without public tokens
UPDATE public.quotes 
SET public_token = encode(gen_random_bytes(6), 'base64')
WHERE public_token IS NULL;