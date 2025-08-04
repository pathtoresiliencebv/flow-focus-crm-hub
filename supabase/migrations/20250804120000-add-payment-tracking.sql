-- Add payment tracking columns to invoices table
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS payment_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50),
ADD COLUMN IF NOT EXISTS stripe_payment_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS payment_failure_reason TEXT;

-- Create invoice_payments table for detailed payment tracking
CREATE TABLE IF NOT EXISTS invoice_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  invoice_number VARCHAR(50) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL DEFAULT 'stripe',
  stripe_payment_id VARCHAR(255),
  stripe_payment_intent_id VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_invoice_payments_invoice_number ON invoice_payments(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoice_payments_status ON invoice_payments(status);
CREATE INDEX IF NOT EXISTS idx_invoice_payments_stripe_payment_id ON invoice_payments(stripe_payment_id);
CREATE INDEX IF NOT EXISTS idx_invoices_payment_status ON invoices(status) WHERE status IN ('betaald', 'betaling_mislukt');

-- Add RLS policies
ALTER TABLE invoice_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their invoice payments" ON invoice_payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM invoices 
      WHERE invoices.invoice_number = invoice_payments.invoice_number
    )
  );

CREATE POLICY "Service role can manage all invoice payments" ON invoice_payments
  FOR ALL USING (auth.role() = 'service_role');

-- Update invoices status enum to include payment statuses
ALTER TYPE invoice_status ADD VALUE IF NOT EXISTS 'betaald';
ALTER TYPE invoice_status ADD VALUE IF NOT EXISTS 'betaling_mislukt';
ALTER TYPE invoice_status ADD VALUE IF NOT EXISTS 'gedeeltelijk_betaald';

-- Function to automatically update invoice status based on payments
CREATE OR REPLACE FUNCTION update_invoice_payment_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the related invoice status based on payment
  IF NEW.status = 'completed' THEN
    UPDATE invoices 
    SET status = 'betaald',
        payment_date = NEW.paid_at,
        payment_method = NEW.payment_method,
        stripe_payment_id = NEW.stripe_payment_id,
        updated_at = NOW()
    WHERE invoice_number = NEW.invoice_number;
  ELSIF NEW.status = 'failed' THEN
    UPDATE invoices 
    SET status = 'betaling_mislukt',
        updated_at = NOW()
    WHERE invoice_number = NEW.invoice_number;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_invoice_payment_status ON invoice_payments;
CREATE TRIGGER trigger_update_invoice_payment_status
  AFTER INSERT OR UPDATE ON invoice_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_payment_status();