-- Enhanced email templates system with AI generation support
-- Update email templates to support categories and AI generation
ALTER TABLE public.email_templates 
ADD COLUMN IF NOT EXISTS template_type text DEFAULT 'custom',
ADD COLUMN IF NOT EXISTS is_system_template boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS usage_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_used_at timestamp with time zone;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_email_templates_category_active 
ON public.email_templates(category, is_active);

CREATE INDEX IF NOT EXISTS idx_email_templates_type 
ON public.email_templates(template_type);

-- Insert some default system templates
INSERT INTO public.email_templates (
  name, subject, body_html, body_text, category, template_type, is_system_template, is_active, user_id
) VALUES 
(
  'Algemene zakelijke email',
  'Betreft: [Onderwerp]',
  '<p>Beste [Naam],</p><p>[Bericht inhoud]</p><p>Met vriendelijke groet,<br>[Uw naam]</p>',
  'Beste [Naam],

[Bericht inhoud]

Met vriendelijke groet,
[Uw naam]',
  'general',
  'system',
  true,
  true,
  (SELECT id FROM auth.users LIMIT 1)
),
(
  'Offerte verzending',
  'Offerte [Nummer] - [Bedrijfsnaam]',
  '<p>Beste [Klantnaam],</p><p>Hierbij ontvangt u onze offerte voor [Project omschrijving].</p><p>De offerte is geldig tot [Datum].</p><p>Voor vragen kunt u contact met ons opnemen.</p><p>Met vriendelijke groet,<br>[Uw naam]</p>',
  'Beste [Klantnaam],

Hierbij ontvangt u onze offerte voor [Project omschrijving].

De offerte is geldig tot [Datum].

Voor vragen kunt u contact met ons opnemen.

Met vriendelijke groet,
[Uw naam]',
  'quotes',
  'system',
  true,
  true,
  (SELECT id FROM auth.users LIMIT 1)
),
(
  'Factuur verzending',
  'Factuur [Nummer] - [Bedrijfsnaam]',
  '<p>Beste [Klantnaam],</p><p>Hierbij ontvangt u factuur [Nummer] voor de uitgevoerde werkzaamheden.</p><p>Het totaalbedrag is €[Bedrag] en dient binnen [Betalingstermijn] dagen te worden voldaan.</p><p>Met vriendelijke groet,<br>[Uw naam]</p>',
  'Beste [Klantnaam],

Hierbij ontvangt u factuur [Nummer] voor de uitgevoerde werkzaamheden.

Het totaalbedrag is €[Bedrag] en dient binnen [Betalingstermijn] dagen te worden voldaan.

Met vriendelijke groet,
[Uw naam]',
  'invoices',
  'system',
  true,
  true,
  (SELECT id FROM auth.users LIMIT 1)
),
(
  'Project oplevering bevestiging',
  'Project [Naam] succesvol opgeleverd',
  '<p>Beste [Klantnaam],</p><p>Hiermee bevestigen wij dat project "[Project naam]" succesvol is opgeleverd op [Datum].</p><p>Alle werkzaamheden zijn volgens afspraak uitgevoerd.</p><p>Wij hopen dat u tevreden bent met het resultaat.</p><p>Met vriendelijke groet,<br>[Uw naam]</p>',
  'Beste [Klantnaam],

Hiermee bevestigen wij dat project "[Project naam]" succesvol is opgeleverd op [Datum].

Alle werkzaamheden zijn volgens afspraak uitgevoerd.

Wij hopen dat u tevreden bent met het resultaat.

Met vriendelijke groet,
[Uw naam]',
  'projects',
  'system',
  true,
  true,
  (SELECT id FROM auth.users LIMIT 1)
)
ON CONFLICT DO NOTHING;