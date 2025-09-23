-- Add new fields to invoices table for enhanced tracking
ALTER TABLE public.invoices 
ADD COLUMN sent_date timestamp with time zone,
ADD COLUMN expires_date date,
ADD COLUMN payment_terms jsonb DEFAULT '[]'::jsonb;