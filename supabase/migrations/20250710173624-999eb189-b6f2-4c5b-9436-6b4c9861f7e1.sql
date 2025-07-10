-- Enable realtime for email tables
ALTER TABLE public.emails REPLICA IDENTITY FULL;
ALTER TABLE public.user_email_settings REPLICA IDENTITY FULL;
ALTER TABLE public.email_sync_logs REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.emails;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_email_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.email_sync_logs;