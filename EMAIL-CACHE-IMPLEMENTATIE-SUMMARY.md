# ✅ EMAIL CACHE IMPLEMENTATIE - VOLTOOID

## 🎯 **WAT IS GEBOUWD:**

Een compleet email caching systeem dat ALLE emails van ALLE folders ophaalt van IMAP en opslaat in Supabase voor snelle toegang.

---

## 📦 **COMPONENTEN:**

### **1. Edge Function: `imap-cache-sync`**
**Locatie:** `supabase/functions/imap-cache-sync/index.ts`

**Functionaliteit:**
- ✅ Detecteert ALLE folders op IMAP server (INBOX, Sent, Drafts, Trash, etc)
- ✅ Fetcht ALLE messages van elke folder (batch processing per 50)
- ✅ Slaat emails op in `email_messages` table (upsert = update bestaande)
- ✅ Gebruikt bestaande Supabase tables (geen Neon nodig!)
- ✅ Error handling en timeout management

**API:**
```javascript
// Volledige sync - alle folders
POST /functions/v1/imap-cache-sync
Body: {
  "accountId": "uuid",
  "fullSync": true
}
```

---

### **2. React Hook: `useCachedEmails`**
**Locatie:** `src/hooks/useCachedEmails.ts`

**Functies:**
- ✅ `fetchEmails(accountId, folder)` - Haal emails uit database cache
- ✅ `syncEmails(accountId)` - Sync van IMAP naar database
- ✅ `getFolders()` - Folder counts ophalen
- ✅ State management (messages, loading, error)

**Interface:**
```typescript
interface CachedEmail {
  id: string;
  subject: string;
  from_email: string;
  to_email: string[];
  body_text: string;
  body_html?: string;
  status: 'unread' | 'read' | 'archived' | 'sent' | 'draft' | 'failed';
  is_starred: boolean;
  folder: string;
  received_at: string;
  created_at: string;
  direction: 'inbound' | 'outbound';
}
```

---

### **3. Frontend: `Email.tsx`**
**Locatie:** `src/pages/Email.tsx`

**Updates:**
- ✅ Gebruikt `useCachedEmails` hook ipv `useLiveEmails`
- ✅ Toont cached emails uit database
- ✅ Sync button triggert volledige IMAP sync
- ✅ Auto-load emails bij mount
- ✅ Folder filtering (Inbox, Sent, Drafts, etc)
- ✅ Correct weergeven van email properties:
  - `from_email` ipv `from`
  - `body_text` ipv `body`
  - `status === 'unread'` ipv `isRead`
  - `is_starred` ipv `isStarred`
  - `received_at` ipv `date`

---

## 🗄️ **DATABASE SCHEMA:**

**Table: `email_messages`** (reeds bestaand in Supabase)

Bevat:
- `id` (PRIMARY KEY) - Format: `{accountId}:{folder}:{uid}`
- `user_id` (FK naar auth.users)
- `direction` - 'inbound' of 'outbound'
- `from_email` - Afzender email
- `to_email[]` - Ontvangers (array)
- `subject` - Onderwerp
- `body_text` - Platte tekst body
- `body_html` - HTML body
- `status` - 'unread', 'read', 'archived', etc
- `is_starred` - Boolean
- `folder` - IMAP folder naam (lowercase, normalized)
- `external_message_id` - Originele IMAP UID
- `received_at` - Ontvangstdatum
- `created_at` / `updated_at` - Timestamps

---

## 🔄 **WORKFLOW:**

### **Eerste Sync:**
1. User klikt "Synchroniseren" in Email.tsx
2. Frontend roept `syncEmails(accountId)` aan
3. Hook triggert `imap-cache-sync` Edge Function
4. Edge Function:
   - Connecteert met IMAP (smtp.hostnet.nl:993)
   - Logt in met account credentials
   - Fetch lijst van alle folders
   - Voor elke folder:
     - SELECT folder
     - Fetch ALLE messages (batch per 50)
     - Parse email data
     - Upsert naar `email_messages` table
5. Frontend refresht emails uit database
6. User ziet ALLE emails van ALLE folders!

### **Vervolgend Gebruik:**
1. Frontend laadt emails direct uit database (snel!)
2. User kan folders switchen (Inbox, Sent, etc)
3. Periodiek sync voor nieuwe emails

---

## ✅ **VOORDELEN:**

1. **Snel laden** - Emails uit database ipv IMAP wachttijd
2. **Offline capable** - Cached emails blijven beschikbaar
3. **Alle folders** - Inbox, Sent, Drafts, Trash, Archive, etc
4. **Geen limiet** - Fetch ALLE emails (niet maar 5 of 50)
5. **Search mogelijk** - Full-text search in database (toekomstig)
6. **Realtime updates** - Supabase Realtime kan gebruikt worden

---

## 🚀 **TESTING:**

### **1. Test Sync:**
```bash
# Via Supabase Dashboard of Postman:
POST https://pvesgvkyiaqmsudmmtkc.supabase.co/functions/v1/imap-cache-sync
Headers:
  Authorization: Bearer YOUR_JWT_TOKEN
  Content-Type: application/json
Body:
{
  "accountId": "YOUR_EMAIL_ACCOUNT_ID",
  "fullSync": true
}
```

### **2. Check Database:**
```sql
-- Totaal aantal emails
SELECT COUNT(*) FROM email_messages;

-- Per folder
SELECT folder, COUNT(*) FROM email_messages 
GROUP BY folder;

-- Recent emails
SELECT subject, from_email, received_at, folder 
FROM email_messages 
ORDER BY received_at DESC 
LIMIT 20;

-- Unread emails
SELECT folder, COUNT(*) FROM email_messages 
WHERE status = 'unread' 
GROUP BY folder;
```

---

## 📝 **VOLGENDE STAPPEN:**

1. ⬜ **Incremental Sync** - Alleen nieuwe emails ophalen
2. ⬜ **Folder Mapping** - Detect Sent/Drafts/Trash folders automatisch
3. ⬜ **Mark as Read** - Update status in database
4. ⬜ **Delete/Archive** - Folder operations
5. ⬜ **Search** - Full-text search in cached emails
6. ⬜ **Attachments** - Download en cache attachments
7. ⬜ **Send Email** - SMTP send functionaliteit
8. ⬜ **Reply/Forward** - Email composition

---

## 🎉 **RESULTAAT:**

✅ **Gebruiker kan nu:**
- Account instellen met SMTP/IMAP (smtp.hostnet.nl)
- Alle emails synchroniseren (1 klik)
- ALLE folders zien (Inbox, Sent, Drafts, etc)
- ALLE emails bekijken (geen limiet meer!)
- Snel navigeren tussen folders
- Emails lezen met volledige content

**Dit is de JUISTE architectuur voor webmail! 🚀**

