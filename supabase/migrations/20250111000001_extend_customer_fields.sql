-- =====================================================
-- EXTEND CUSTOMERS TABLE WITH BUSINESS FIELDS
-- Purpose: Add professional customer management fields
-- Created: 2025-01-11
-- =====================================================

-- Add new columns to customers table
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS customer_type TEXT DEFAULT 'particulier' CHECK (customer_type IN ('particulier', 'zakelijk')),
  ADD COLUMN IF NOT EXISTS company_name TEXT,
  ADD COLUMN IF NOT EXISTS kvk_number TEXT,
  ADD COLUMN IF NOT EXISTS btw_number TEXT,
  ADD COLUMN IF NOT EXISTS contact_person TEXT,
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS iban TEXT,
  ADD COLUMN IF NOT EXISTS postal_code TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Nederland',
  ADD COLUMN IF NOT EXISTS additional_emails JSONB DEFAULT '[]'::jsonb;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_customers_customer_type ON public.customers(customer_type);
CREATE INDEX IF NOT EXISTS idx_customers_company_name ON public.customers(company_name);
CREATE INDEX IF NOT EXISTS idx_customers_kvk_number ON public.customers(kvk_number);
CREATE INDEX IF NOT EXISTS idx_customers_postal_code ON public.customers(postal_code);

-- Add comments
COMMENT ON COLUMN public.customers.customer_type IS 'Type klant: particulier of zakelijk';
COMMENT ON COLUMN public.customers.company_name IS 'Bedrijfsnaam (voor zakelijke klanten)';
COMMENT ON COLUMN public.customers.kvk_number IS 'KVK nummer (Kamer van Koophandel)';
COMMENT ON COLUMN public.customers.btw_number IS 'BTW nummer (VAT number)';
COMMENT ON COLUMN public.customers.contact_person IS 'Naam van contactpersoon';
COMMENT ON COLUMN public.customers.website IS 'Website URL';
COMMENT ON COLUMN public.customers.iban IS 'IBAN rekeningnummer';
COMMENT ON COLUMN public.customers.postal_code IS 'Postcode';
COMMENT ON COLUMN public.customers.country IS 'Land';
COMMENT ON COLUMN public.customers.additional_emails IS 'Extra email adressen (JSON array)';

-- Verify the changes
DO $$
BEGIN
  RAISE NOTICE '✅ Customer table extended with business fields';
  RAISE NOTICE '   - customer_type (particulier/zakelijk)';
  RAISE NOTICE '   - company_name, kvk_number, btw_number';
  RAISE NOTICE '   - contact_person, website, iban';
  RAISE NOTICE '   - postal_code, country';
  RAISE NOTICE '   - additional_emails (JSON array)';
END $$;

