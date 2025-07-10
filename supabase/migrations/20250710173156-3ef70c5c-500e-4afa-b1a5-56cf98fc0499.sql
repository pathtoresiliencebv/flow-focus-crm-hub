-- Add OAuth and sync capabilities to user_email_settings
ALTER TABLE public.user_email_settings 
ADD COLUMN provider_type TEXT DEFAULT 'imap',
ADD COLUMN oauth_access_token TEXT,
ADD COLUMN oauth_refresh_token TEXT,
ADD COLUMN oauth_token_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN last_sync_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN sync_status TEXT DEFAULT 'never_synced',
ADD COLUMN sync_error_message TEXT,
ADD COLUMN is_syncing BOOLEAN DEFAULT false;

-- Add indexes for better performance
CREATE INDEX idx_user_email_settings_provider ON public.user_email_settings(provider_type);
CREATE INDEX idx_user_email_settings_sync_status ON public.user_email_settings(sync_status);
CREATE INDEX idx_user_email_settings_last_sync ON public.user_email_settings(last_sync_at);

-- Update emails table to support better threading and sync tracking
ALTER TABLE public.emails
ADD COLUMN provider_message_id TEXT,
ADD COLUMN sync_hash TEXT,
ADD COLUMN raw_headers JSONB;

-- Add indexes for email sync performance
CREATE INDEX idx_emails_provider_message_id ON public.emails(provider_message_id);
CREATE INDEX idx_emails_sync_hash ON public.emails(sync_hash);
CREATE INDEX idx_emails_settings_folder ON public.emails(email_settings_id, folder);

-- Create email sync logs table for debugging and monitoring
CREATE TABLE public.email_sync_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    email_settings_id UUID NOT NULL REFERENCES public.user_email_settings(id) ON DELETE CASCADE,
    sync_started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    sync_completed_at TIMESTAMP WITH TIME ZONE,
    emails_processed INTEGER DEFAULT 0,
    emails_added INTEGER DEFAULT 0,
    emails_updated INTEGER DEFAULT 0,
    sync_status TEXT NOT NULL DEFAULT 'running',
    error_message TEXT,
    sync_duration_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on email_sync_logs
ALTER TABLE public.email_sync_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for email_sync_logs
CREATE POLICY "Users can view their own email sync logs" 
ON public.email_sync_logs 
FOR SELECT 
USING (
    email_settings_id IN (
        SELECT id FROM public.user_email_settings 
        WHERE user_id = auth.uid()
    )
);

-- Add trigger to update sync timestamp
CREATE OR REPLACE FUNCTION public.update_email_settings_sync_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_email_settings_sync_timestamp
    BEFORE UPDATE ON public.user_email_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_email_settings_sync_timestamp();