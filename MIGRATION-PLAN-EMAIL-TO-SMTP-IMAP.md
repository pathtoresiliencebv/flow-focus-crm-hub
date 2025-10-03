# 📧 MIGRATIE PLAN: Gmail Email → SMTP/IMAP Email Systeem

**Datum:** 3 Oktober 2025  
**Status:** PLANNING  
**Impact:** Medium - Email functionaliteit wordt volledig vervangen

---

## 🎯 **DOEL**

Huidige Gmail OAuth-based email systeem vervangen met een configureerbaar SMTP/IMAP systeem (Roundcube-stijl), waarbij:
- ✅ Elke gebruiker zijn eigen email account kan configureren
- ✅ SMTP/IMAP instellingen zelf in te stellen (Gmail, Outlook, custom mail server)
- ✅ Bestaande email data behouden blijft
- ✅ Andere CRM functionaliteiten (projecten, klanten, planning) NIET kapot gaan

---

## 📊 **HUIDIGE SITUATIE**

### **Bestaande Database Schema:**
```sql
✅ email_accounts (id, user_id, provider, email_address, access_token, refresh_token)
✅ email_threads (id, account_id, thread_id, subject, participants, is_read)
✅ email_messages (id, thread_id, message_id, from_email, to_emails, body_html)
✅ email_attachments (id, message_id, filename, storage_url)
✅ email_labels (id, account_id, name, type, color)
```

### **Bestaande Edge Functions:**
```
❌ gmail-sync (VERWIJDEREN)
❌ gmail-oauth-init (VERWIJDEREN)
❌ gmail-oauth-callback (VERWIJDEREN)
```

### **Bestaande Frontend:**
```
✅ src/pages/Email.tsx - Hoofdpagina (BEHOUDEN, aanpassen)
✅ src/components/Email.tsx - Email component (BEHOUDEN, aanpassen)
✅ src/hooks/useEmailAccounts.ts (BEHOUDEN, aanpassen)
✅ src/hooks/useEmailThreads.ts (BEHOUDEN)
❌ src/components/email/ConnectEmailAccount.tsx (VERVANGEN)
❌ src/components/email/GmailCallbackHandler.tsx (VERWIJDEREN)
```

---

## 🏗️ **NIEUWE ARCHITECTUUR**

### **1. Database Wijzigingen**

#### **A. Update `email_accounts` table:**
```sql
-- Add SMTP/IMAP configuration fields
ALTER TABLE email_accounts 
  DROP COLUMN IF EXISTS provider,
  DROP COLUMN IF EXISTS access_token,
  DROP COLUMN IF EXISTS refresh_token;

ALTER TABLE email_accounts
  ADD COLUMN smtp_host TEXT NOT NULL DEFAULT '',
  ADD COLUMN smtp_port INTEGER NOT NULL DEFAULT 587,
  ADD COLUMN smtp_username TEXT NOT NULL DEFAULT '',
  ADD COLUMN smtp_password TEXT NOT NULL DEFAULT '', -- Encrypted!
  ADD COLUMN smtp_encryption TEXT DEFAULT 'tls', -- 'tls', 'ssl', 'none'
  
  ADD COLUMN imap_host TEXT NOT NULL DEFAULT '',
  ADD COLUMN imap_port INTEGER NOT NULL DEFAULT 993,
  ADD COLUMN imap_username TEXT NOT NULL DEFAULT '',
  ADD COLUMN imap_password TEXT NOT NULL DEFAULT '', -- Encrypted!
  ADD COLUMN imap_encryption TEXT DEFAULT 'ssl', -- 'ssl', 'tls', 'none'
  
  ADD COLUMN sync_enabled BOOLEAN DEFAULT true,
  ADD COLUMN sync_interval INTEGER DEFAULT 5, -- minutes
  ADD COLUMN last_error TEXT;

-- Update display_name to be optional
ALTER TABLE email_accounts
  ALTER COLUMN display_name DROP NOT NULL;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_accounts_user_sync 
  ON email_accounts(user_id, sync_enabled, last_sync_at);
```

#### **B. Keep Other Tables (NO CHANGES):**
```sql
✅ email_threads - Blijft zoals het is
✅ email_messages - Blijft zoals het is  
✅ email_attachments - Blijft zoals het is
✅ email_labels - Blijft zoals het is
✅ email_drafts - Blijft zoals het is (als die bestaat)
```

### **2. Nieuwe Edge Functions**

#### **A. `imap-sync` - Email Synchronisatie**
```typescript
// supabase/functions/imap-sync/index.ts
// VERVANGT: gmail-sync

Doel: 
- Connect naar IMAP server
- Fetch nieuwe emails
- Parse email headers & body
- Store in email_threads & email_messages
- Download attachments naar Supabase Storage

Libraries:
- Deno std
- node-imap (of Deno equivalent)
- mailparser

Security:
- Decrypt SMTP/IMAP passwords before use
- Rate limiting
- Error handling voor foute credentials
```

#### **B. `smtp-send` - Email Verzenden**
```typescript
// supabase/functions/smtp-send/index.ts
// NIEUW

Doel:
- Verzend email via SMTP
- Support voor HTML + plain text
- Attachment support
- Save naar Sent folder (IMAP)

Input:
{
  accountId: uuid,
  to: email[],
  cc?: email[],
  bcc?: email[],
  subject: string,
  bodyHtml: string,
  bodyText: string,
  attachments?: File[],
  inReplyTo?: messageId
}

Libraries:
- Deno SMTP client (denomailer)
- node-imap voor "Sent" folder sync
```

#### **C. `test-email-connection` - Test SMTP/IMAP**
```typescript
// supabase/functions/test-email-connection/index.ts
// NIEUW

Doel:
- Test SMTP connection (send test email)
- Test IMAP connection (fetch folder list)
- Return success/error

Used by: Setup wizard in frontend
```

### **3. Password Encryption**

**BELANGRIJK:** Email passwords moeten encrypted worden!

```typescript
// Use Supabase Vault or crypto-js

// Encrypt before saving
const encryptPassword = async (password: string): Promise<string> => {
  // Use AES encryption with secret key from env
  const secretKey = Deno.env.get('EMAIL_ENCRYPTION_KEY')!;
  return CryptoJS.AES.encrypt(password, secretKey).toString();
};

// Decrypt when using
const decryptPassword = async (encrypted: string): Promise<string> => {
  const secretKey = Deno.env.get('EMAIL_ENCRYPTION_KEY')!;
  const bytes = CryptoJS.AES.decrypt(encrypted, secretKey);
  return bytes.toString(CryptoJS.enc.Utf8);
};
```

### **4. Frontend Wijzigingen**

#### **A. Nieuwe Component: `SMTPIMAPSetup.tsx`**
```typescript
// src/components/email/SMTPIMAPSetup.tsx
// VERVANGT: ConnectEmailAccount.tsx

Features:
- Form voor SMTP settings (host, port, username, password, encryption)
- Form voor IMAP settings (host, port, username, password, encryption)
- "Test Connection" button
- Pre-filled templates voor Gmail, Outlook, etc.
- Validation
- Password visibility toggle
- Save & enable sync

UI Layout:
┌────────────────────────────────┐
│  Email Account Configuratie    │
├────────────────────────────────┤
│ Quick Setup:                   │
│ [Gmail] [Outlook] [Custom]     │
├────────────────────────────────┤
│ SMTP Instellingen              │
│  Server: [smtp.gmail.com    ]  │
│  Poort:  [587              ]   │
│  Username: [naam@gmail.com ]   │
│  Password: [••••••••••••   ]   │
│  Encryption: (•) TLS ( ) SSL   │
├────────────────────────────────┤
│ IMAP Instellingen              │
│  Server: [imap.gmail.com    ]  │
│  Poort:  [993              ]   │
│  Username: [naam@gmail.com ]   │
│  Password: [••••••••••••   ]   │
│  Encryption: (•) SSL ( ) TLS   │
├────────────────────────────────┤
│ [Test Verbinding] [Opslaan]    │
└────────────────────────────────┘
```

#### **B. Update: `Email.tsx`**
```typescript
// src/pages/Email.tsx
// AANPASSEN (niet vervangen)

Changes:
- Remove Gmail OAuth logic
- Add SMTP/IMAP setup wizard
- Update sync button to use imap-sync
- Keep layout (sidebar, thread list, preview)
- Add "Add Email Account" button
```

#### **C. Update: `useEmailAccounts.ts`**
```typescript
// src/hooks/useEmailAccounts.ts
// AANPASSEN

Changes:
- Remove OAuth token logic
- Add SMTP/IMAP credentials handling
- Add testConnection() function
- Add syncAccount() function (calls imap-sync)
```

#### **D. Quick Setup Presets**
```typescript
// src/lib/emailPresets.ts

export const emailPresets = {
  gmail: {
    name: 'Gmail',
    smtp: { host: 'smtp.gmail.com', port: 587, encryption: 'tls' },
    imap: { host: 'imap.gmail.com', port: 993, encryption: 'ssl' },
    instructions: 'Gebruik een App-specifiek wachtwoord voor Gmail.'
  },
  outlook: {
    name: 'Outlook',
    smtp: { host: 'smtp-mail.outlook.com', port: 587, encryption: 'tls' },
    imap: { host: 'outlook.office365.com', port: 993, encryption: 'ssl' },
  },
  yahoo: {
    name: 'Yahoo',
    smtp: { host: 'smtp.mail.yahoo.com', port: 587, encryption: 'tls' },
    imap: { host: 'imap.mail.yahoo.com', port: 993, encryption: 'ssl' },
  },
  custom: {
    name: 'Custom',
    smtp: { host: '', port: 587, encryption: 'tls' },
    imap: { host: '', port: 993, encryption: 'ssl' },
  }
};
```

---

## 🔄 **MIGRATIE STAPPEN**

### **FASE 1: Database Update (Dag 1)**
- [ ] 1.1 Backup huidige `email_accounts` table
- [ ] 1.2 Run migration: Add SMTP/IMAP columns
- [ ] 1.3 Optioneel: Probeer bestaande Gmail accounts te migreren
  ```sql
  -- Voor bestaande Gmail accounts, set presets
  UPDATE email_accounts 
  SET 
    smtp_host = 'smtp.gmail.com',
    smtp_port = 587,
    smtp_username = email_address,
    smtp_encryption = 'tls',
    imap_host = 'imap.gmail.com',
    imap_port = 993,
    imap_username = email_address,
    imap_encryption = 'ssl',
    sync_enabled = false -- Gebruiker moet nieuwe credentials invoeren
  WHERE provider = 'gmail';
  ```
- [ ] 1.4 Test database queries

### **FASE 2: Edge Functions (Dag 2-3)**
- [ ] 2.1 Maak `imap-sync` function
  - [ ] IMAP connection logic
  - [ ] Email parsing
  - [ ] Store in database
  - [ ] Error handling
- [ ] 2.2 Maak `smtp-send` function
  - [ ] SMTP connection logic
  - [ ] Email sending
  - [ ] Attachment support
- [ ] 2.3 Maak `test-email-connection` function
- [ ] 2.4 Deploy functions
- [ ] 2.5 Test met test email account

### **FASE 3: Frontend Components (Dag 4-5)**
- [ ] 3.1 Maak `SMTPIMAPSetup.tsx` component
  - [ ] Form UI
  - [ ] Presets dropdown
  - [ ] Validation
  - [ ] Test connection button
- [ ] 3.2 Update `Email.tsx`
  - [ ] Remove Gmail OAuth button
  - [ ] Add "Add Email Account" wizard
  - [ ] Update sync logic
- [ ] 3.3 Update `useEmailAccounts.ts` hook
- [ ] 3.4 Update `EmailAccountForm.tsx` (als die bestaat)

### **FASE 4: Password Encryption (Dag 6)**
- [ ] 4.1 Setup encryption key in Supabase secrets
- [ ] 4.2 Implement encryption helpers
- [ ] 4.3 Update Edge Functions om passwords te decrypten
- [ ] 4.4 Test end-to-end

### **FASE 5: Cleanup (Dag 7)**
- [ ] 5.1 Verwijder oude Gmail Edge Functions:
  ```bash
  # In Supabase Dashboard > Edge Functions
  # Delete: gmail-sync
  # Delete: gmail-oauth-init
  # Delete: gmail-oauth-callback
  ```
- [ ] 5.2 Verwijder oude frontend componenten:
  ```bash
  rm src/components/email/GmailCallbackHandler.tsx
  ```
- [ ] 5.3 Update documentatie
- [ ] 5.4 Archive oude docs:
  - Move `email-system/02-GMAIL-OAUTH-SETUP.md` → `_archive/`

### **FASE 6: Testing & Rollout (Dag 8-9)**
- [ ] 6.1 Test met verschillende providers:
  - [ ] Gmail (met app password)
  - [ ] Outlook
  - [ ] Custom SMTP
- [ ] 6.2 Test email sync (IMAP)
- [ ] 6.3 Test email verzenden (SMTP)
- [ ] 6.4 Test attachments
- [ ] 6.5 Test multi-account
- [ ] 6.6 User acceptance testing

---

## ⚠️ **BACKWARDS COMPATIBILITY**

### **Wat Blijft Werken:**
✅ Alle bestaande email threads & messages blijven toegankelijk  
✅ Email labels blijven werken  
✅ Email attachments blijven toegankelijk  
✅ Email search blijft werken  
✅ RLS policies blijven intact

### **Wat Breekt:**
❌ Bestaande Gmail OAuth tokens worden invalid  
❌ Automatische sync stopt tot gebruiker nieuwe credentials invoert

### **User Communicatie:**
```
⚠️ BELANGRIJK: Email Systeem Update

We hebben je email systeem geüpgraded naar een flexibeler 
SMTP/IMAP systeem. Dit betekent:

✅ Je kan nu elk email account gebruiken (niet alleen Gmail)
✅ Meer controle over je email instellingen
✅ Betere privacy (geen OAuth tokens bij derden)

📋 ACTIE VEREIST:
1. Ga naar "Instellingen" → "Email Accounts"
2. Klik "Email Account Toevoegen"
3. Voer je SMTP/IMAP instellingen in
4. Test de verbinding
5. Activeer synchronisatie

❓ Hulp nodig? Zie: docs/EMAIL-SETUP-GUIDE.md
```

---

## 🎯 **DELIVERABLES**

### **Code:**
- [ ] Migration SQL: `20251003_email_smtp_imap_migration.sql`
- [ ] Edge Function: `imap-sync/index.ts`
- [ ] Edge Function: `smtp-send/index.ts`
- [ ] Edge Function: `test-email-connection/index.ts`
- [ ] Component: `SMTPIMAPSetup.tsx`
- [ ] Helper: `emailPresets.ts`
- [ ] Helper: `emailEncryption.ts`

### **Documentatie:**
- [ ] `EMAIL-SMTP-IMAP-SETUP.md` - User guide
- [ ] `EMAIL-DEVELOPER-GUIDE.md` - Technical docs
- [ ] Update `README.md` met nieuwe email setup

### **Testing:**
- [ ] Unit tests voor encryption helpers
- [ ] Integration tests voor Edge Functions
- [ ] E2E tests voor email flow

---

## 📅 **TIMELINE**

| Fase | Dagen | Status |
|------|-------|--------|
| Database Update | 1 | ⏳ Pending |
| Edge Functions | 2 | ⏳ Pending |
| Frontend Components | 2 | ⏳ Pending |
| Encryption | 1 | ⏳ Pending |
| Cleanup | 1 | ⏳ Pending |
| Testing | 2 | ⏳ Pending |
| **TOTAAL** | **9 dagen** | |

---

## 🚨 **RISICO'S & MITIGATIE**

| Risico | Impact | Mitigatie |
|--------|--------|-----------|
| Gebruikers kunnen niet meer inloggen op Gmail | Hoog | Duidelijke communicatie + handleiding |
| IMAP sync is langzaam | Medium | Implementeer pagination & background jobs |
| Passwords niet veilig opgeslagen | Hoog | Use proper encryption + Supabase Vault |
| SMTP geblokkeerd door firewall | Medium | Support meerdere ports (587, 465, 25) |
| Rate limiting door email provider | Medium | Implementeer retry logic + backoff |

---

## ✅ **ACCEPTATIE CRITERIA**

- [ ] Gebruiker kan SMTP/IMAP account toevoegen
- [ ] Gebruiker kan credentials testen
- [ ] Email sync werkt voor Gmail, Outlook, custom
- [ ] Email verzenden werkt
- [ ] Attachments werken (send + receive)
- [ ] Bestaande email data blijft toegankelijk
- [ ] Multi-account support werkt
- [ ] Passwords zijn encrypted
- [ ] Andere CRM features (projecten, klanten, planning) werken nog
- [ ] Mobile app werkt (als applicable)
- [ ] Performance: Sync < 30 seconden voor 100 emails
- [ ] User documentatie is compleet

---

## 📚 **REFERENTIES**

- **Roundcube:** https://github.com/roundcube/roundcubemail
- **IMAP RFC:** https://www.rfc-editor.org/rfc/rfc3501
- **SMTP RFC:** https://www.rfc-editor.org/rfc/rfc5321
- **Gmail IMAP:** https://support.google.com/mail/answer/7126229
- **Outlook IMAP:** https://support.microsoft.com/en-us/office/pop-imap-and-smtp-settings

---

**VOLGENDE STAP:** Review dit plan en geef feedback. Dan maak ik het tweede plan voor Calendar migratie.

