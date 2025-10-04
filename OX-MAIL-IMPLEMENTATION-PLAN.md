# 🎯 OX MAIL API IMPLEMENTATIE PLAN

**Doel:** Overschakelen van RAW IMAP naar OX Mail REST API  
**Reden:** Alle huidige problemen oplossen  
**Tijd:** 2-3 uur werk  
**Priority:** HIGH - Dit lost ALLES op  

---

## ✅ **WAAROM OX MAIL API?**

### **Problemen met RAW IMAP:**
```
❌ Complex IMAP protocol parsing
❌ BODYSTRUCTURE regex moeilijk
❌ Bijlagen niet downloadbaar
❌ HTML parsing unstable
❌ Alleen 1 email geladen (parser faalt)
```

### **Voordelen OX API:**
```
✅ REST API met JSON responses
✅ Bijlagen met directe download URLs
✅ HTML + Plain text bodies gescheiden
✅ Betrouwbare folder management
✅ Geen regex parsing nodig
✅ Getest en stable (Hostnet gebruikt dit)
```

---

## 📋 **IMPLEMENTATIE STAPPEN:**

### **FASE 1: OX API Edge Function (1 uur)**
```
1. Create: supabase/functions/ox-mail-sync/index.ts
2. OX API authentication (username/password)
3. GET /ajax/mail?action=all (fetch emails)
4. Parse JSON response
5. Return to frontend
```

### **FASE 2: Frontend Update (30 min)**
```
1. Update useCachedEmails.ts
2. Call ox-mail-sync instead of imap-sync
3. Parse OX JSON format
4. Display emails
```

### **FASE 3: Bijlagen Download (30 min)**
```
1. OX API attachment URLs
2. GET /ajax/mail?action=attachment
3. Download button → fetch bijlage
4. "Opslaan als bon" met echte file
```

### **FASE 4: SMTP via OX (30 min)**
```
1. POST /ajax/mail?action=new
2. Send email via OX API
3. Better than raw SMTP
```

---

## 🔧 **OX API ENDPOINTS:**

```
Base URL: https://webmail.hostnet.nl/ajax

Authentication:
POST /ajax/login?action=login
  → Returns session ID

Get Emails:
GET /ajax/mail?action=all&folder=default0/INBOX
  → Returns JSON array of emails

Get Email Detail:
GET /ajax/mail?action=get&id=123&folder=default0/INBOX
  → Returns full email with HTML/text/attachments

Download Attachment:
GET /ajax/mail?action=attachment&id=123&folder=default0/INBOX&attachment=1
  → Returns file binary

Send Email:
POST /ajax/mail?action=new
  → Send email
```

---

## 💾 **SERVER SETTINGS:**

```sql
UPDATE email_accounts SET
  imap_host = 'imap02.hostnet.nl',
  imap_port = 1143,
  smtp_host = 'smtp02.hostnet.nl',
  smtp_port = 25
WHERE email_address = 'info@smansonderhoud.nl';
```

---

## 🚀 **IMPLEMENTATIE:**

**Wil je:**
1. **Volledige OX API implementatie?** (alle 4 fases, 2-3 uur)
2. **Start met Fase 1** (OX email fetch, 1 uur)
3. **Eerst server settings update** (5 min test)

**Laat me weten en ik ga direct beginnen!** 🎯
