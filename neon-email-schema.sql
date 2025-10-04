-- NEON DATABASE SCHEMA FOR EMAIL CACHING
-- Database URL: postgresql://neondb_owner:npg_FpB9SsRKz6jG@ep-red-dream-ad09kizx-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

-- Email accounts table (sync config)
CREATE TABLE IF NOT EXISTS email_accounts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  email_address TEXT NOT NULL,
  display_name TEXT,
  
  -- IMAP config
  imap_host TEXT NOT NULL,
  imap_port INTEGER NOT NULL,
  imap_username TEXT NOT NULL,
  imap_password TEXT NOT NULL, -- Encrypted
  imap_encryption TEXT NOT NULL, -- ssl/tls/none
  
  -- SMTP config  
  smtp_host TEXT NOT NULL,
  smtp_port INTEGER NOT NULL,
  smtp_username TEXT NOT NULL,
  smtp_password TEXT NOT NULL, -- Encrypted
  smtp_encryption TEXT NOT NULL, -- tls/ssl/none
  
  -- Sync status
  last_sync_at TIMESTAMP,
  sync_enabled BOOLEAN DEFAULT true,
  connection_status TEXT DEFAULT 'unconfigured',
  last_error TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Email messages table (cached from IMAP)
CREATE TABLE IF NOT EXISTS email_messages (
  id TEXT PRIMARY KEY, -- Format: {account_id}:{folder}:{uid}
  account_id TEXT NOT NULL REFERENCES email_accounts(id) ON DELETE CASCADE,
  
  -- IMAP metadata
  imap_uid INTEGER NOT NULL,
  folder TEXT NOT NULL, -- INBOX, Sent, Drafts, Trash, etc
  message_id TEXT, -- RFC822 Message-ID
  
  -- Email headers
  subject TEXT,
  from_email TEXT,
  from_name TEXT,
  to_emails TEXT[], -- Array of recipient emails
  cc_emails TEXT[],
  bcc_emails TEXT[],
  reply_to TEXT,
  
  -- Dates
  date TIMESTAMP,
  received_at TIMESTAMP,
  
  -- Content
  body_text TEXT, -- Plain text body
  body_html TEXT, -- HTML body
  snippet TEXT, -- First 200 chars preview
  
  -- Flags
  is_read BOOLEAN DEFAULT false,
  is_starred BOOLEAN DEFAULT false,
  is_answered BOOLEAN DEFAULT false,
  is_draft BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  
  -- Attachments
  has_attachments BOOLEAN DEFAULT false,
  attachments JSONB, -- [{filename, size, contentType, url}]
  
  -- Threading
  thread_id TEXT,
  in_reply_to TEXT,
  references TEXT[],
  
  -- Metadata
  size_bytes INTEGER,
  raw_flags TEXT[],
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(account_id, folder, imap_uid)
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_email_messages_account_folder ON email_messages(account_id, folder);
CREATE INDEX IF NOT EXISTS idx_email_messages_date ON email_messages(date DESC);
CREATE INDEX IF NOT EXISTS idx_email_messages_thread ON email_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_email_messages_flags ON email_messages(account_id, is_read, is_starred, is_deleted);
CREATE INDEX IF NOT EXISTS idx_email_messages_search ON email_messages USING gin(to_tsvector('english', subject || ' ' || body_text));

-- Email folders table (track what folders exist)
CREATE TABLE IF NOT EXISTS email_folders (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES email_accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- IMAP folder name
  display_name TEXT NOT NULL, -- User-friendly name
  type TEXT, -- inbox, sent, drafts, trash, junk, archive, custom
  message_count INTEGER DEFAULT 0,
  unread_count INTEGER DEFAULT 0,
  last_sync_at TIMESTAMP,
  
  UNIQUE(account_id, name)
);

-- Folder type mapping (standard IMAP folders)
INSERT INTO email_folders (id, account_id, name, display_name, type) VALUES
  ('dummy-inbox', 'dummy', 'INBOX', 'Postvak IN', 'inbox'),
  ('dummy-sent', 'dummy', 'Sent', 'Verzonden', 'sent'),
  ('dummy-drafts', 'dummy', 'Drafts', 'Concepten', 'drafts'),
  ('dummy-trash', 'dummy', 'Trash', 'Prullenbak', 'trash'),
  ('dummy-junk', 'dummy', 'Junk', 'Spam', 'junk'),
  ('dummy-archive', 'dummy', 'Archive', 'Archief', 'archive')
ON CONFLICT DO NOTHING;

