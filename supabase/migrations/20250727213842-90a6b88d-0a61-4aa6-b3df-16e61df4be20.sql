-- Add email account for bonnetjes processing
INSERT INTO public.user_email_settings (
  user_id,
  email_address,
  display_name,
  imap_host,
  imap_port,
  imap_encryption,
  smtp_host,
  smtp_port,
  smtp_encryption,
  username,
  password,
  is_active,
  provider,
  auto_sync_enabled,
  sync_frequency_minutes
) VALUES (
  (SELECT id FROM public.profiles WHERE role = 'Administrator' LIMIT 1),
  'bonnetjes@smanscrm.nl',
  'Bonnetjes Processing',
  'imap.hostinger.com',
  993,
  'SSL',
  'smtp.hostinger.com',
  465,
  'SSL',
  'bonnetjes@smanscrm.nl',
  'SmansCRM1256!@',
  true,
  'hostinger',
  true,
  5
);

-- Enable pg_cron extension for scheduling
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the bonnetjes sync to run every 5 minutes
SELECT cron.schedule(
  'bonnetjes-sync',
  '*/5 * * * *', -- every 5 minutes
  $$
  SELECT
    net.http_post(
        url:='https://pvesgvkyiaqmsudmmtkc.supabase.co/functions/v1/email-receipt-sync',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2ZXNndmt5aWFxbXN1ZG1tdGtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg0NjI5MjIsImV4cCI6MjA2NDAzODkyMn0.Z-0t4zz2WyTiLaUIRPZzwxx9YtDiEe457X6RgQOXmU8"}'::jsonb,
        body:='{"email": "bonnetjes@smanscrm.nl"}'::jsonb
    ) as request_id;
  $$
);