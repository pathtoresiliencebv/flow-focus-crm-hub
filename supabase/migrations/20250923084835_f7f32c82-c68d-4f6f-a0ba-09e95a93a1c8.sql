-- Add payment tracking fields to invoices table
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS payment_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS payment_method text,
ADD COLUMN IF NOT EXISTS stripe_checkout_session_id text,
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text,
ADD COLUMN IF NOT EXISTS payment_link_url text,
ADD COLUMN IF NOT EXISTS payment_failure_reason text;

-- Update invoice status enum if needed
COMMENT ON COLUMN public.invoices.payment_status IS 'Payment status: pending, processing, paid, failed, refunded';
COMMENT ON COLUMN public.invoices.payment_date IS 'When payment was successfully completed';
COMMENT ON COLUMN public.invoices.payment_method IS 'Payment method used (stripe, bank_transfer, cash, etc.)';
COMMENT ON COLUMN public.invoices.stripe_checkout_session_id IS 'Stripe checkout session ID for tracking';
COMMENT ON COLUMN public.invoices.stripe_payment_intent_id IS 'Stripe payment intent ID for tracking';
COMMENT ON COLUMN public.invoices.payment_link_url IS 'Generated payment link URL';
COMMENT ON COLUMN public.invoices.payment_failure_reason IS 'Reason for payment failure if applicable';