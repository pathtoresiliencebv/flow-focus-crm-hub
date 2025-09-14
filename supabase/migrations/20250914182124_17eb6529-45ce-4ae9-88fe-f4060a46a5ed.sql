-- Create storage bucket for quote attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'quote-attachments',
  'quote-attachments',
  false,
  20971520, -- 20MB limit
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for quote attachments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated users can upload quote attachments'
  ) THEN
    CREATE POLICY "Authenticated users can upload quote attachments"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'quote-attachments');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated users can view quote attachments'
  ) THEN
    CREATE POLICY "Authenticated users can view quote attachments"
    ON storage.objects FOR SELECT TO authenticated
    USING (bucket_id = 'quote-attachments');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Public read access for quote attachments with valid tokens'
  ) THEN
    CREATE POLICY "Public read access for quote attachments with valid tokens"
    ON storage.objects FOR SELECT TO anon
    USING (bucket_id = 'quote-attachments');
  END IF;
END
$$;

-- Add invoice archive support
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS archived_by UUID REFERENCES auth.users(id);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS auto_saved_at TIMESTAMP WITH TIME ZONE;