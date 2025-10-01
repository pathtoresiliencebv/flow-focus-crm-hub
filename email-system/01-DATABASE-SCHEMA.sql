-- 📧 EMAIL SYSTEM - Complete Database Schema
-- Geïnspireerd door Mail0/Zero architecture

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
  sync_token TEXT, -- For incremental sync
  history_id TEXT, -- Gmail history ID
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_primary BOOLEAN DEFAULT false,
  sync_enabled BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, email_address)
);

-- ============================================
-- 2. EMAIL THREADS TABLE (Conversations)
-- ============================================
CREATE TABLE IF NOT EXISTS email_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES email_accounts(id) ON DELETE CASCADE,
  
  -- Thread identifiers
  thread_id TEXT NOT NULL, -- Provider's thread ID
  
  -- Thread metadata
  subject TEXT,
  snippet TEXT, -- Preview text
  message_count INTEGER DEFAULT 1,
  
  -- Participants (array of {email, name} objects)
  participants JSONB DEFAULT '[]',
  
  -- Timestamps
  first_message_at TIMESTAMPTZ,
  last_message_at TIMESTAMPTZ,
  
  -- Status flags
  is_read BOOLEAN DEFAULT false,
  is_starred BOOLEAN DEFAULT false,
  is_important BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  
  -- Labels/Folders
  labels TEXT[] DEFAULT '{}',
  folder VARCHAR(50) DEFAULT 'inbox', -- inbox, sent, drafts, trash, spam
  
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
  
  -- Message identifiers
  message_id TEXT NOT NULL, -- Provider's message ID
  
  -- Email headers
  from_email VARCHAR(255) NOT NULL,
  from_name VARCHAR(255),
  reply_to VARCHAR(255),
  
  to_emails JSONB DEFAULT '[]', -- [{email, name}]
  cc_emails JSONB DEFAULT '[]',
  bcc_emails JSONB DEFAULT '[]',
  
  subject TEXT,
  
  -- Email body
  body_text TEXT,
  body_html TEXT,
  
  -- Metadata
  received_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  
  -- Headers (for advanced features)
  headers JSONB DEFAULT '{}',
  
  -- Status flags
  is_read BOOLEAN DEFAULT false,
  is_draft BOOLEAN DEFAULT false,
  is_sent BOOLEAN DEFAULT false,
  
  -- Labels
  labels TEXT[] DEFAULT '{}',
  
  -- References (for threading)
  in_reply_to TEXT,
  references TEXT[],
  
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
  
  -- File metadata
  filename VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100),
  size BIGINT, -- bytes
  
  -- Storage
  storage_url TEXT, -- Supabase Storage URL
  attachment_id TEXT, -- Provider's attachment ID
  
  -- Display flags
  is_inline BOOLEAN DEFAULT false,
  content_id TEXT, -- For inline images
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. EMAIL LABELS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS email_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES email_accounts(id) ON DELETE CASCADE,
  
  -- Label details
  name VARCHAR(100) NOT NULL,
  label_type VARCHAR(20) DEFAULT 'custom' CHECK (label_type IN ('system', 'custom')),
  
  -- Visual
  color VARCHAR(7), -- Hex color
  icon VARCHAR(50),
  
  -- Metadata
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
  
  -- Draft content
  to_emails JSONB DEFAULT '[]',
  cc_emails JSONB DEFAULT '[]',
  bcc_emails JSONB DEFAULT '[]',
  subject TEXT,
  body_html TEXT,
  body_text TEXT,
  
  -- Reply/Forward metadata
  in_reply_to_message_id UUID REFERENCES email_messages(id) ON DELETE SET NULL,
  is_reply BOOLEAN DEFAULT false,
  is_forward BOOLEAN DEFAULT false,
  
  -- Attachments (stored separately, linked by draft_id)
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Email Accounts
CREATE INDEX idx_email_accounts_user_id ON email_accounts(user_id);
CREATE INDEX idx_email_accounts_active ON email_accounts(user_id, is_active) WHERE is_active = true;

-- Email Threads
CREATE INDEX idx_email_threads_account ON email_threads(account_id);
CREATE INDEX idx_email_threads_folder ON email_threads(account_id, folder);
CREATE INDEX idx_email_threads_last_message ON email_threads(account_id, last_message_at DESC);
CREATE INDEX idx_email_threads_unread ON email_threads(account_id, is_read) WHERE is_read = false;
CREATE INDEX idx_email_threads_labels ON email_threads USING GIN(labels);

-- Email Messages
CREATE INDEX idx_email_messages_thread ON email_messages(thread_id);
CREATE INDEX idx_email_messages_received ON email_messages(thread_id, received_at DESC);
CREATE INDEX idx_email_messages_from ON email_messages(from_email);

-- Email Attachments
CREATE INDEX idx_email_attachments_message ON email_attachments(message_id);

-- Email Labels
CREATE INDEX idx_email_labels_account ON email_labels(account_id);

-- Email Drafts
CREATE INDEX idx_email_drafts_account ON email_drafts(account_id);
CREATE INDEX idx_email_drafts_updated ON email_drafts(account_id, updated_at DESC);

-- ============================================
-- RLS POLICIES
-- ============================================

-- Email Accounts
ALTER TABLE email_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own email accounts"
ON email_accounts FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own email accounts"
ON email_accounts FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own email accounts"
ON email_accounts FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own email accounts"
ON email_accounts FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Email Threads
ALTER TABLE email_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view threads from their accounts"
ON email_threads FOR SELECT
TO authenticated
USING (
  account_id IN (
    SELECT id FROM email_accounts WHERE user_id = auth.uid()
  )
);

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

CREATE POLICY "Users can manage drafts from their accounts"
ON email_drafts FOR ALL
TO authenticated
USING (
  account_id IN (
    SELECT id FROM email_accounts WHERE user_id = auth.uid()
  )
);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

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

-- ✅ EMAIL SYSTEM DATABASE SCHEMA COMPLETE!

