-- 📧 EMAIL SYSTEM - Complete Database Schema (SAFE VERSION)
-- Uses IF NOT EXISTS to prevent errors when re-running

-- ============================================
-- 1. EMAIL ACCOUNTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS email_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Account details
  provider VARCHAR(20) NOT NULL CHECK (provider IN ('gmail', 'outlook', 'imap')),
  email_address VARCHAR(255) NOT NULL,
  display_name VARCHAR(255),
  
  -- OAuth tokens (encrypted in Supabase Vault)
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  
  -- IMAP/SMTP settings (for generic providers)
  imap_settings JSONB DEFAULT '{}',
  smtp_settings JSONB DEFAULT '{}',
  
  -- Sync metadata
  last_sync_at TIMESTAMPTZ,
  sync_token TEXT,
  history_id TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_primary BOOLEAN DEFAULT false,
  sync_enabled BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, email_address)
);

-- ============================================
-- 2. EMAIL THREADS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS email_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES email_accounts(id) ON DELETE CASCADE,
  
  thread_id TEXT NOT NULL,
  subject TEXT,
  snippet TEXT,
  message_count INTEGER DEFAULT 1,
  participants JSONB DEFAULT '[]',
  
  first_message_at TIMESTAMPTZ,
  last_message_at TIMESTAMPTZ,
  
  is_read BOOLEAN DEFAULT false,
  is_starred BOOLEAN DEFAULT false,
  is_important BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  
  labels TEXT[] DEFAULT '{}',
  folder VARCHAR(50) DEFAULT 'inbox',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(account_id, thread_id)
);

-- ============================================
-- 3. EMAIL MESSAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS email_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES email_threads(id) ON DELETE CASCADE,
  
  message_id TEXT NOT NULL,
  
  from_email VARCHAR(255) NOT NULL,
  from_name VARCHAR(255),
  reply_to VARCHAR(255),
  
  to_emails JSONB DEFAULT '[]',
  cc_emails JSONB DEFAULT '[]',
  bcc_emails JSONB DEFAULT '[]',
  
  subject TEXT,
  body_text TEXT,
  body_html TEXT,
  
  received_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  headers JSONB DEFAULT '{}',
  
  is_read BOOLEAN DEFAULT false,
  is_draft BOOLEAN DEFAULT false,
  is_sent BOOLEAN DEFAULT false,
  
  labels TEXT[] DEFAULT '{}',
  
  in_reply_to TEXT,
  email_references TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(thread_id, message_id)
);

-- ============================================
-- 4. EMAIL ATTACHMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS email_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES email_messages(id) ON DELETE CASCADE,
  
  filename VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100),
  size BIGINT,
  
  storage_url TEXT,
  attachment_id TEXT,
  
  is_inline BOOLEAN DEFAULT false,
  content_id TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. EMAIL LABELS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS email_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES email_accounts(id) ON DELETE CASCADE,
  
  name VARCHAR(100) NOT NULL,
  label_type VARCHAR(20) DEFAULT 'custom' CHECK (label_type IN ('system', 'custom')),
  
  color VARCHAR(7),
  icon VARCHAR(50),
  message_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(account_id, name)
);

-- ============================================
-- 6. EMAIL DRAFTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS email_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES email_accounts(id) ON DELETE CASCADE,
  
  to_emails JSONB DEFAULT '[]',
  cc_emails JSONB DEFAULT '[]',
  bcc_emails JSONB DEFAULT '[]',
  subject TEXT,
  body_html TEXT,
  body_text TEXT,
  
  in_reply_to_message_id UUID REFERENCES email_messages(id) ON DELETE SET NULL,
  is_reply BOOLEAN DEFAULT false,
  is_forward BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES (using IF NOT EXISTS)
-- ============================================

-- Email Accounts
CREATE INDEX IF NOT EXISTS idx_email_accounts_user_id ON email_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_email_accounts_active ON email_accounts(user_id, is_active) WHERE is_active = true;

-- Email Threads
CREATE INDEX IF NOT EXISTS idx_email_threads_account ON email_threads(account_id);
CREATE INDEX IF NOT EXISTS idx_email_threads_folder ON email_threads(account_id, folder);
CREATE INDEX IF NOT EXISTS idx_email_threads_last_message ON email_threads(account_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_threads_unread ON email_threads(account_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_email_threads_labels ON email_threads USING GIN(labels);

-- Email Messages
CREATE INDEX IF NOT EXISTS idx_email_messages_thread ON email_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_email_messages_received ON email_messages(thread_id, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_messages_from ON email_messages(from_email);

-- Email Attachments
CREATE INDEX IF NOT EXISTS idx_email_attachments_message ON email_attachments(message_id);

-- Email Labels
CREATE INDEX IF NOT EXISTS idx_email_labels_account ON email_labels(account_id);

-- Email Drafts
CREATE INDEX IF NOT EXISTS idx_email_drafts_account ON email_drafts(account_id);
CREATE INDEX IF NOT EXISTS idx_email_drafts_updated ON email_drafts(account_id, updated_at DESC);

-- ============================================
-- RLS POLICIES (drop existing first to avoid conflicts)
-- ============================================

-- Email Accounts
ALTER TABLE email_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own email accounts" ON email_accounts;
CREATE POLICY "Users can view their own email accounts"
ON email_accounts FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own email accounts" ON email_accounts;
CREATE POLICY "Users can insert their own email accounts"
ON email_accounts FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own email accounts" ON email_accounts;
CREATE POLICY "Users can update their own email accounts"
ON email_accounts FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own email accounts" ON email_accounts;
CREATE POLICY "Users can delete their own email accounts"
ON email_accounts FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Email Threads
ALTER TABLE email_threads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view threads from their accounts" ON email_threads;
CREATE POLICY "Users can view threads from their accounts"
ON email_threads FOR SELECT
TO authenticated
USING (
  account_id IN (
    SELECT id FROM email_accounts WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can manage threads from their accounts" ON email_threads;
CREATE POLICY "Users can manage threads from their accounts"
ON email_threads FOR ALL
TO authenticated
USING (
  account_id IN (
    SELECT id FROM email_accounts WHERE user_id = auth.uid()
  )
);

-- Email Messages
ALTER TABLE email_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view messages from their threads" ON email_messages;
CREATE POLICY "Users can view messages from their threads"
ON email_messages FOR SELECT
TO authenticated
USING (
  thread_id IN (
    SELECT et.id FROM email_threads et
    JOIN email_accounts ea ON ea.id = et.account_id
    WHERE ea.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can manage messages from their threads" ON email_messages;
CREATE POLICY "Users can manage messages from their threads"
ON email_messages FOR ALL
TO authenticated
USING (
  thread_id IN (
    SELECT et.id FROM email_threads et
    JOIN email_accounts ea ON ea.id = et.account_id
    WHERE ea.user_id = auth.uid()
  )
);

-- Email Attachments
ALTER TABLE email_attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view attachments from their messages" ON email_attachments;
CREATE POLICY "Users can view attachments from their messages"
ON email_attachments FOR SELECT
TO authenticated
USING (
  message_id IN (
    SELECT em.id FROM email_messages em
    JOIN email_threads et ON et.id = em.thread_id
    JOIN email_accounts ea ON ea.id = et.account_id
    WHERE ea.user_id = auth.uid()
  )
);

-- Email Labels
ALTER TABLE email_labels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage labels from their accounts" ON email_labels;
CREATE POLICY "Users can manage labels from their accounts"
ON email_labels FOR ALL
TO authenticated
USING (
  account_id IN (
    SELECT id FROM email_accounts WHERE user_id = auth.uid()
  )
);

-- Email Drafts
ALTER TABLE email_drafts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage drafts from their accounts" ON email_drafts;
CREATE POLICY "Users can manage drafts from their accounts"
ON email_drafts FOR ALL
TO authenticated
USING (
  account_id IN (
    SELECT id FROM email_accounts WHERE user_id = auth.uid()
  )
);

-- ============================================
-- TRIGGERS (drop existing first)
-- ============================================

DROP TRIGGER IF EXISTS email_accounts_updated_at ON email_accounts;
DROP TRIGGER IF EXISTS email_threads_updated_at ON email_threads;
DROP TRIGGER IF EXISTS email_messages_updated_at ON email_messages;
DROP TRIGGER IF EXISTS email_drafts_updated_at ON email_drafts;

CREATE OR REPLACE FUNCTION update_email_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER email_accounts_updated_at
BEFORE UPDATE ON email_accounts
FOR EACH ROW
EXECUTE FUNCTION update_email_updated_at();

CREATE TRIGGER email_threads_updated_at
BEFORE UPDATE ON email_threads
FOR EACH ROW
EXECUTE FUNCTION update_email_updated_at();

CREATE TRIGGER email_messages_updated_at
BEFORE UPDATE ON email_messages
FOR EACH ROW
EXECUTE FUNCTION update_email_updated_at();

CREATE TRIGGER email_drafts_updated_at
BEFORE UPDATE ON email_drafts
FOR EACH ROW
EXECUTE FUNCTION update_email_updated_at();

-- ✅ EMAIL SYSTEM DATABASE SCHEMA COMPLETE (SAFE TO RE-RUN)!

