-- Customer Data Enhancement - Add business fields
ALTER TABLE customers ADD COLUMN IF NOT EXISTS kvk_number VARCHAR(20);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS btw_number VARCHAR(30);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS email_addresses JSONB DEFAULT '[]';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS invoice_address JSONB;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS shipping_address JSONB;

-- Migrate existing emails to new format for customers that have emails
UPDATE customers 
SET email_addresses = CASE 
  WHEN email IS NOT NULL AND email != '' THEN jsonb_build_array(jsonb_build_object('email', email, 'type', 'primary'))
  ELSE '[]'::jsonb
END
WHERE email_addresses = '[]'::jsonb OR email_addresses IS NULL;

-- Invoice System Enhancement - Add missing fields for modern management
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS archived_by UUID REFERENCES auth.users(id);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS auto_saved_at TIMESTAMP WITH TIME ZONE;

-- Update existing invoices
UPDATE invoices SET is_archived = FALSE WHERE is_archived IS NULL;