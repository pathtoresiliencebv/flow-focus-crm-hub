-- Nylas Email Integration Migration
-- Creates tables for Nylas API integration with OAuth authentication

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create nylas_accounts table
CREATE TABLE IF NOT EXISTS public.nylas_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email_address text NOT NULL,
  grant_id text NOT NULL UNIQUE,
  provider text NOT NULL CHECK (provider IN ('gmail', 'outlook', 'yahoo', 'icloud', 'imap')),
  access_token text, -- encrypted
  refresh_token text, -- encrypted
  token_expires_at timestamptz,
  sync_state text DEFAULT 'initial' CHECK (sync_state IN ('initial', 'syncing', 'synced', 'error')),
  is_active boolean DEFAULT true,
  last_sync_at timestamptz,
  last_error text,
  last_error_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create nylas_messages table
CREATE TABLE IF NOT EXISTS public.nylas_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nylas_account_id uuid REFERENCES public.nylas_accounts(id) ON DELETE CASCADE NOT NULL,
  nylas_message_id text NOT NULL,
  thread_id text,
  from_email text,
  from_name text,
  to_emails jsonb DEFAULT '[]'::jsonb,
  cc_emails jsonb DEFAULT '[]'::jsonb,
  bcc_emails jsonb DEFAULT '[]'::jsonb,
  subject text,
  body_text text,
  body_html text,
  received_at timestamptz,
  sent_at timestamptz,
  is_read boolean DEFAULT false,
  is_starred boolean DEFAULT false,
  labels text[] DEFAULT '{}',
  folder text DEFAULT 'inbox',
  has_attachments boolean DEFAULT false,
  attachments jsonb DEFAULT '[]'::jsonb,
  in_reply_to text,
  references text,
  message_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(nylas_account_id, nylas_message_id)
);

-- Create nylas_threads table
CREATE TABLE IF NOT EXISTS public.nylas_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nylas_account_id uuid REFERENCES public.nylas_accounts(id) ON DELETE CASCADE NOT NULL,
  nylas_thread_id text NOT NULL,
  subject text,
  participants jsonb DEFAULT '[]'::jsonb,
  message_count integer DEFAULT 0,
  last_message_at timestamptz,
  is_read boolean DEFAULT false,
  is_starred boolean DEFAULT false,
  labels text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(nylas_account_id, nylas_thread_id)
);

-- Create nylas_contacts table
CREATE TABLE IF NOT EXISTS public.nylas_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nylas_account_id uuid REFERENCES public.nylas_accounts(id) ON DELETE CASCADE NOT NULL,
  nylas_contact_id text NOT NULL,
  email text NOT NULL,
  name text,
  company text,
  phone text,
  notes jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(nylas_account_id, nylas_contact_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_nylas_accounts_user_id ON public.nylas_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_nylas_accounts_email ON public.nylas_accounts(email_address);
CREATE INDEX IF NOT EXISTS idx_nylas_accounts_grant_id ON public.nylas_accounts(grant_id);

CREATE INDEX IF NOT EXISTS idx_nylas_messages_account_id ON public.nylas_messages(nylas_account_id);
CREATE INDEX IF NOT EXISTS idx_nylas_messages_thread_id ON public.nylas_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_nylas_messages_folder ON public.nylas_messages(folder);
CREATE INDEX IF NOT EXISTS idx_nylas_messages_received_at ON public.nylas_messages(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_nylas_messages_from_email ON public.nylas_messages(from_email);
CREATE INDEX IF NOT EXISTS idx_nylas_messages_subject ON public.nylas_messages(subject);

CREATE INDEX IF NOT EXISTS idx_nylas_threads_account_id ON public.nylas_threads(nylas_account_id);
CREATE INDEX IF NOT EXISTS idx_nylas_threads_last_message_at ON public.nylas_threads(last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_nylas_contacts_account_id ON public.nylas_contacts(nylas_account_id);
CREATE INDEX IF NOT EXISTS idx_nylas_contacts_email ON public.nylas_contacts(email);
CREATE INDEX IF NOT EXISTS idx_nylas_contacts_name ON public.nylas_contacts(name);

-- Enable Row Level Security
ALTER TABLE public.nylas_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nylas_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nylas_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nylas_contacts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for nylas_accounts
CREATE POLICY "Users can view their own nylas accounts" ON public.nylas_accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own nylas accounts" ON public.nylas_accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own nylas accounts" ON public.nylas_accounts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own nylas accounts" ON public.nylas_accounts
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for nylas_messages
CREATE POLICY "Users can view messages from their accounts" ON public.nylas_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.nylas_accounts 
      WHERE id = nylas_account_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages to their accounts" ON public.nylas_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.nylas_accounts 
      WHERE id = nylas_account_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update messages from their accounts" ON public.nylas_messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.nylas_accounts 
      WHERE id = nylas_account_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete messages from their accounts" ON public.nylas_messages
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.nylas_accounts 
      WHERE id = nylas_account_id AND user_id = auth.uid()
    )
  );

-- RLS Policies for nylas_threads
CREATE POLICY "Users can view threads from their accounts" ON public.nylas_threads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.nylas_accounts 
      WHERE id = nylas_account_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert threads to their accounts" ON public.nylas_threads
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.nylas_accounts 
      WHERE id = nylas_account_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update threads from their accounts" ON public.nylas_threads
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.nylas_accounts 
      WHERE id = nylas_account_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete threads from their accounts" ON public.nylas_threads
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.nylas_accounts 
      WHERE id = nylas_account_id AND user_id = auth.uid()
    )
  );

-- RLS Policies for nylas_contacts
CREATE POLICY "Users can view contacts from their accounts" ON public.nylas_contacts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.nylas_accounts 
      WHERE id = nylas_account_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert contacts to their accounts" ON public.nylas_contacts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.nylas_accounts 
      WHERE id = nylas_account_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update contacts from their accounts" ON public.nylas_contacts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.nylas_accounts 
      WHERE id = nylas_account_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete contacts from their accounts" ON public.nylas_contacts
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.nylas_accounts 
      WHERE id = nylas_account_id AND user_id = auth.uid()
    )
  );

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER handle_updated_at_nylas_accounts
  BEFORE UPDATE ON public.nylas_accounts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_nylas_messages
  BEFORE UPDATE ON public.nylas_messages
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_nylas_threads
  BEFORE UPDATE ON public.nylas_threads
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_nylas_contacts
  BEFORE UPDATE ON public.nylas_contacts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create function to get user's primary nylas account
CREATE OR REPLACE FUNCTION public.get_primary_nylas_account(user_uuid uuid)
RETURNS TABLE (
  id uuid,
  email_address text,
  grant_id text,
  provider text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    na.id,
    na.email_address,
    na.grant_id,
    na.provider
  FROM public.nylas_accounts na
  WHERE na.user_id = user_uuid 
    AND na.is_active = true
  ORDER BY na.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get message counts by folder
CREATE OR REPLACE FUNCTION public.get_nylas_folder_counts(user_uuid uuid)
RETURNS TABLE (
  folder text,
  total_count bigint,
  unread_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    nm.folder,
    COUNT(*) as total_count,
    COUNT(*) FILTER (WHERE nm.is_read = false) as unread_count
  FROM public.nylas_messages nm
  JOIN public.nylas_accounts na ON nm.nylas_account_id = na.id
  WHERE na.user_id = user_uuid
  GROUP BY nm.folder
  ORDER BY nm.folder;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.nylas_accounts TO anon, authenticated;
GRANT ALL ON public.nylas_messages TO anon, authenticated;
GRANT ALL ON public.nylas_threads TO anon, authenticated;
GRANT ALL ON public.nylas_contacts TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_primary_nylas_account(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_nylas_folder_counts(uuid) TO anon, authenticated;


