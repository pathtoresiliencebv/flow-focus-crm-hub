# 📧 NEON EMAIL CACHE SETUP INSTRUCTIES

## 🎯 **OVERZICHT:**

We gebruiken Neon PostgreSQL voor email caching omdat:
1. **Snel** - Emails 1x ophalen van IMAP, daarna direct van database
2. **Alle folders** - Inbox, Sent, Drafts, Trash, Starred, Archive
3. **Alle emails** - Geen limiet meer van 5 of 50 messages
4. **Search** - Full-text search in emails
5. **Offline** - Emails blijven beschikbaar

---

## 📋 **STAP 1: NEON DATABASE SETUP**

### **1.1 Verbind met Neon:**
```bash
# Database URL:
postgresql://neondb_owner:npg_FpB9SsRKz6jG@ep-red-dream-ad09kizx-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

### **1.2 Run Schema:**
```bash
# Kopieer inhoud van neon-email-schema.sql
# Plak in Neon SQL Editor en run
```

### **1.3 Verify Tables:**
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Moet tonen:
-- email_accounts
-- email_messages  
-- email_folders
```

---

## 🚀 **STAP 2: DEPLOY EDGE FUNCTION**

### **2.1 Deploy imap-full-sync:**
```bash
# Via Supabase MCP:
# Deploy: supabase/functions/imap-full-sync/index.ts
```

### **2.2 Test Function:**
```bash
curl -X POST https://pvesgvkyiaqmsudmmtkc.supabase.co/functions/v1/imap-full-sync \
  -H "Authorization: Bearer YOUR_SUPABASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"accountId": "YOUR_ACCOUNT_ID", "fullSync": true}'
```

---

## 🔄 **STAP 3: FRONTEND AANPASSING**

### **3.1 Create Neon Hook:**
```typescript
// src/hooks/useNeonEmails.ts
import { useState, useEffect } from 'react';
import postgres from 'postgres';

const NEON_URL = 'postgresql://...';

export const useNeonEmails = (accountId: string, folder: string) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchMessages() {
      const sql = postgres(NEON_URL);
      
      const msgs = await sql`
        SELECT * FROM email_messages
        WHERE account_id = ${accountId}
        AND folder = ${folder}
        AND is_deleted = false
        ORDER BY date DESC
      `;
      
      setMessages(msgs);
      setLoading(false);
      await sql.end();
    }
    
    fetchMessages();
  }, [accountId, folder]);
  
  return { messages, loading };
};
```

### **3.2 Update Email.tsx:**
```typescript
// Replace useLiveEmails with useNeonEmails
const { messages, loading } = useNeonEmails(primaryAccount?.id, selectedFolder);
```

---

## ✅ **WORKFLOW:**

### **Eerste keer:**
1. User configureert SMTP/IMAP account
2. Klik "Synchroniseren"
3. Backend fetcht ALLE folders + ALLE emails
4. Sla op in Neon database
5. Frontend toont van Neon (snel!)

### **Daarna:**
1. Klik "Synchroniseren" voor nieuwe emails
2. Backend fetcht alleen NIEUWE emails (incremental)
3. Update Neon database
4. Frontend refresht

### **Voordelen:**
- ✅ **Veel sneller** - Geen IMAP wait tijd
- ✅ **Alle folders** - Sent, Drafts, etc
- ✅ **Alle emails** - Geen limiet
- ✅ **Search werkt** - Full-text in database
- ✅ **Offline capable** - Cache blijft

---

## 🔍 **TESTING:**

### **Check emails in Neon:**
```sql
-- Totaal aantal emails
SELECT COUNT(*) FROM email_messages;

-- Per folder
SELECT folder, COUNT(*) FROM email_messages 
GROUP BY folder;

-- Recent emails
SELECT subject, from_email, date, folder 
FROM email_messages 
ORDER BY date DESC 
LIMIT 20;

-- Unread count
SELECT folder, COUNT(*) FROM email_messages 
WHERE is_read = false 
GROUP BY folder;
```

---

## 🎯 **NEXT STEPS:**

1. ✅ Setup Neon database (dit document)
2. ⬜ Deploy imap-full-sync function
3. ⬜ Create useNeonEmails hook
4. ⬜ Update Email.tsx
5. ⬜ Test sync + display
6. ⬜ Implement incremental sync
7. ⬜ Add search functionality

