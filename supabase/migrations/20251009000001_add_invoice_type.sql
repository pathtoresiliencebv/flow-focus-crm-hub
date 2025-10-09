-- Add invoice_type column to invoices table
-- Supports 'simple' (one total amount) and 'detailed' (itemized with blocks)

DO $$ 
BEGIN
  -- Add invoice_type column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema='public' 
                 AND table_name='invoices' 
                 AND column_name='invoice_type') THEN
    ALTER TABLE public.invoices 
    ADD COLUMN invoice_type TEXT DEFAULT 'detailed' 
    CHECK (invoice_type IN ('simple', 'detailed'));
  END IF;
END $$;

-- Add simple_description column for simple invoices
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema='public' 
                 AND table_name='invoices' 
                 AND column_name='simple_description') THEN
    ALTER TABLE public.invoices 
    ADD COLUMN simple_description TEXT;
  END IF;
END $$;

-- Create index for invoice_type
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_type ON public.invoices(invoice_type);

-- Comment
COMMENT ON COLUMN public.invoices.invoice_type IS 'Type of invoice: simple (one total amount) or detailed (itemized with blocks)';
COMMENT ON COLUMN public.invoices.simple_description IS 'Description for simple invoices (replaces line items)';

