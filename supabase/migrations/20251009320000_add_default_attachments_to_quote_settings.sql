-- Add default_attachments column to quote_settings table
-- This allows storing default attachments that are automatically added to new quotes

ALTER TABLE public.quote_settings 
ADD COLUMN IF NOT EXISTS default_attachments JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.quote_settings.default_attachments IS 'Default attachments that are automatically added to new quotes';

