-- Add customer_id to quotes and invoices for proper customer linking

-- Add customer_id to quotes table
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id) ON DELETE SET NULL;

-- Add customer_id to invoices table  
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quotes_customer_id ON quotes(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);

-- Try to link existing quotes to customers based on customer_name
UPDATE quotes q
SET customer_id = c.id
FROM customers c
WHERE q.customer_name = c.name
AND q.customer_id IS NULL;

-- Try to link existing invoices to customers based on customer_name
UPDATE invoices i
SET customer_id = c.id
FROM customers c
WHERE i.customer_name = c.name
AND i.customer_id IS NULL;

-- Add comment explaining the column
COMMENT ON COLUMN quotes.customer_id IS 'Foreign key to customers table for proper relational linking';
COMMENT ON COLUMN invoices.customer_id IS 'Foreign key to customers table for proper relational linking';

