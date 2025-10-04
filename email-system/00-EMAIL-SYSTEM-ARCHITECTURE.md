# 📧 Complete Email System - Architecture

**Geïnspireerd door:** [Mail0/Zero](https://github.com/Mail-0/Zero)

## 🎯 **DOELEN**

Een volledig email systeem binnen de CRM met:
- ✅ **Unified Inbox** - Alle emails op één plek
- ✅ **Multi-provider** - Gmail, Outlook, IMAP/SMTP
- ✅ **Thread View** - Conversaties zoals Gmail
- ✅ **Rich Composer** - HTML email editor
- ✅ **Real-time Sync** - Live email synchronisatie
- ✅ **Attachments** - Bestanden verzenden/ontvangen
- ✅ **Search & Filter** - Krachtige zoekfunctie
- ✅ **Labels/Folders** - Organisatie systeem
- ✅ **Multi-account** - Meerdere email accounts

---

## 🏗️ **ARCHITECTUUR**

### **1. Database Schema**

```sql
-- Email Accounts (meerdere providers)
email_accounts:
  - id (uuid)
  - user_id (uuid) → profiles
  - provider (gmail|outlook|imap)
  - email_address (text)
  - display_name (text)
  - access_token (encrypted)
  - refresh_token (encrypted)
  - imap_settings (jsonb)
  - smtp_settings (jsonb)
  - last_sync_at (timestamp)
  - is_active (boolean)

-- Email Threads (conversaties)
email_threads:
  - id (uuid)
  - account_id (uuid) → email_accounts
  - thread_id (text) - provider thread ID
  - subject (text)
  - participants (jsonb[]) - [{email, name}]
  - snippet (text) - preview
  - message_count (int)
  - last_message_at (timestamp)
  - is_read (boolean)
  - is_starred (boolean)
  - labels (text[])

-- Email Messages (individuele emails)
email_messages:
  - id (uuid)
  - thread_id (uuid) → email_threads
  - message_id (text) - provider message ID
  - from_email (text)
  - from_name (text)
  - to_emails (jsonb[])
  - cc_emails (jsonb[])
  - bcc_emails (jsonb[])
  - subject (text)
  - body_text (text)
  - body_html (text)
  - received_at (timestamp)
  - is_read (boolean)
  - is_draft (boolean)
  - labels (text[])

-- Email Attachments
email_attachments:
  - id (uuid)
  - message_id (uuid) → email_messages
  - filename (text)
  - mime_type (text)
  - size (bigint)
  - storage_url (text) - Supabase Storage
  - inline (boolean)

-- Email Labels/Folders
email_labels:
  - id (uuid)
  - account_id (uuid) → email_accounts
  - name (text)
  - type (system|custom)
  - color (text)
  - icon (text)
```

### **2. Email Providers Integratie**

**Gmail API:**
- OAuth2 met Google Cloud Console
- Gmail API voor sync (threads.list, messages.get)
- Real-time notifications via Pub/Sub

**Outlook/Microsoft:**
- OAuth2 met Microsoft Graph API
- Microsoft Graph Mail API
- Webhooks voor real-time updates

**Generic IMAP/SMTP:**
- Node-imap voor inbox sync
- Nodemailer voor email verzending
- Polling interval voor updates

### **3. Synchronisatie Flow**

```
1. Initial Sync:
   ↓
   Fetch all threads (paginated)
   ↓
   Store in database
   ↓
   Download recent messages
   ↓
   Extract & store attachments

2. Real-time Updates:
   ↓
   Gmail: Pub/Sub notifications
   ↓
   Outlook: Microsoft Graph webhooks
   ↓
   IMAP: Polling (every 30s)
   ↓
   Update threads & messages
```

### **4. Frontend Components**

```
EmailPage/
├── Sidebar
│   ├── AccountSwitcher
│   ├── FolderList (Inbox, Sent, Drafts, etc.)
│   └── LabelList (Custom labels)
├── ThreadList
│   ├── SearchBar
│   ├── ThreadItem[]
│   └── Pagination
├── ThreadView
│   ├── MessageList
│   ├── MessageItem[]
│   └── QuickReply
└── Composer
    ├── RichTextEditor (Tiptap/Lexical)
    ├── AttachmentUpload
    └── Send/Draft buttons
```

---

## 🔐 **SECURITY & PRIVACY**

- ✅ **Encrypted Tokens** - Access/refresh tokens via Supabase Vault
- ✅ **RLS Policies** - Row-level security per user
- ✅ **No Data Selling** - 100% privacy (like Mail0)
- ✅ **Local Storage** - Emails in eigen database
- ✅ **Secure Sync** - OAuth2 only, no password storage

---

## 🚀 **TECH STACK**

**Backend:**
- Supabase Edge Functions (email sync workers)
- Node-imap / Nodemailer
- Gmail API SDK
- Microsoft Graph SDK

**Frontend:**
- React + TypeScript
- TailwindCSS + Shadcn UI
- Tiptap (rich text editor)
- Zustand (email state)

**Storage:**
- PostgreSQL (threads, messages)
- Supabase Storage (attachments)

---

## 📊 **FEATURES PRIORITEIT**

### **Phase 1: Basic Email** (Week 1)
- ✅ Gmail OAuth integration
- ✅ Thread list + message view
- ✅ Basic composer (plain text)
- ✅ Mark as read/unread

### **Phase 2: Rich Features** (Week 2)
- ✅ HTML email composer
- ✅ Attachments send/receive
- ✅ Search & filters
- ✅ Labels/folders

### **Phase 3: Multi-Provider** (Week 3)
- ✅ Outlook integration
- ✅ IMAP/SMTP generic
- ✅ Multi-account switching

### **Phase 4: Advanced** (Week 4)
- ✅ Real-time sync (webhooks)
- ✅ Email templates
- ✅ Scheduled send
- ✅ Email tracking (read receipts)

---

## 🎨 **UI/UX INSPIRATIE (Mail0)**

- **Clean Interface** - Minimalistisch design
- **Thread View** - Gmail-style conversaties
- **Quick Actions** - Archive, delete, label shortcuts
- **Smart Compose** - Auto-complete adressen
- **Dark Mode** - Theme support
- **Keyboard Shortcuts** - Power user features

---

## 🔄 **SYNC STRATEGY**

**Initial Sync:**
- Fetch last 500 threads
- Store in database
- Background: continue syncing older emails

**Incremental Sync:**
- Every 30 seconds (IMAP)
- Real-time (Gmail Pub/Sub, Outlook webhooks)
- Only fetch new/updated threads

**Conflict Resolution:**
- Provider = source of truth
- Local changes sync back immediately
- Optimistic UI updates

---

## ✅ **SUCCESS METRICS**

- [ ] **Sync Speed**: < 5s initial load
- [ ] **Real-time**: < 1s new email notification
- [ ] **Search**: < 500ms response time
- [ ] **Compose**: Rich HTML editor
- [ ] **Multi-account**: Switch accounts instantly

---

**KLAAR OM TE BOUWEN! 🚀**

