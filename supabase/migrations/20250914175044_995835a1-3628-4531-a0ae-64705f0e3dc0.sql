-- Add auto-save support and archival system for quotes
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS auto_saved_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS archived_by UUID REFERENCES auth.users(id);

-- Add customer enhancement fields
ALTER TABLE customers ADD COLUMN IF NOT EXISTS kvk_number VARCHAR(20);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS btw_number VARCHAR(30);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS email_addresses JSONB DEFAULT '[]';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS invoice_address JSONB;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS shipping_address JSONB;

-- Migrate existing customer emails to new format if they exist
UPDATE customers 
SET email_addresses = CASE 
  WHEN email IS NOT NULL AND email != '' THEN jsonb_build_array(jsonb_build_object('email', email, 'type', 'primary'))
  ELSE '[]'::jsonb
END
WHERE email_addresses IS NULL OR email_addresses = '[]'::jsonb;