-- Extend invoice_items table to support block structure preservation
ALTER TABLE invoice_items 
ADD COLUMN block_title TEXT,
ADD COLUMN block_order INTEGER,
ADD COLUMN item_formatting JSONB;