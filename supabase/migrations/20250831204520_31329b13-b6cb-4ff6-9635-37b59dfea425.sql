-- Complete reset van offertes/facturen systeem
-- Stap 1: Verwijder alle project tasks die gegenereerd zijn vanuit quotes
DELETE FROM public.project_tasks 
WHERE source_quote_block_id IS NOT NULL 
   OR source_quote_item_id IS NOT NULL;

-- Stap 2: Ontkoppel projecten van quotes (behoud projecten maar verwijder quote koppeling)
UPDATE public.projects 
SET quote_id = NULL 
WHERE quote_id IS NOT NULL;

-- Stap 3: Verwijder alle factuur items
DELETE FROM public.invoice_items;

-- Stap 4: Verwijder alle facturen
DELETE FROM public.invoices;

-- Stap 5: Verwijder alle offertes
DELETE FROM public.quotes;

-- Reset auto-increment sequences voor nieuwe nummering
-- Deze worden automatisch gereset door de database functies generate_quote_number() en generate_invoice_number()