# 🐛 Email Systeem Debug Guide

## ❌ **PROBLEMEN:**
1. Emails worden niet ingeladen
2. Kan geen emails versturen

---

## 🔍 **DEBUG STAPPEN:**

### **1. Check Browser Console**

Open de browser console (F12) en kijk naar:

```javascript
// Bij het openen van Email tab:
Email threads query result: { data: [...], error: null, accountId: "...", folder: "inbox" }

// Bij het klikken op refresh:
Sync result: { messageCount: X, ... }

// Bij het verzenden van een email:
Sending email via: smtp-send { accountId: "...", provider: "smtp", to: "...", subject: "..." }
Send result: { data: {...}, error: null }
```

### **2. Controleer Database**

#### **Check Email Account:**
```sql
SELECT id, email_address, provider, smtp_host, imap_host 
FROM email_accounts 
WHERE user_id = '<your-user-id>';
```

Moet tonen:
- ✅ `email_address`: jouw email
- ✅ `provider`: 'smtp'
- ✅ `smtp_host`: bijv. 'smtp.gmail.com'
- ✅ `imap_host`: bijv. 'imap.gmail.com'

#### **Check Email Threads:**
```sql
SELECT id, account_id, subject, last_message_at 
FROM email_threads 
ORDER BY last_message_at DESC 
LIMIT 10;
```

Als **leeg**: Je moet eerst emails syncen!

#### **Check Email Messages:**
```sql
SELECT id, thread_id, from_email, subject, sent_at 
FROM email_messages 
ORDER BY sent_at DESC 
LIMIT 10;
```

---

## 🔧 **OPLOSSINGEN:**

### **Probleem: Geen emails worden geladen**

**Oorzaak:** Database is leeg, er zijn nog geen emails gesynchroniseerd.

**Oplossing:**
1. Klik op de **refresh knop** (🔄) in de email interface
2. Dit roept `imap-sync` edge function aan
3. Wacht 10-30 seconden
4. Check console voor: `Sync result: { messageCount: X }`
5. Refresh de pagina

**Als sync faalt:**
```javascript
// Check console voor error
// Mogelijke oorzaken:
- Edge function not deployed
- IMAP credentials incorrect
- IMAP niet enabled in email account
```

**Deploy edge functions:**
```bash
supabase functions deploy imap-sync
supabase functions deploy smtp-send
```

---

### **Probleem: Kan geen emails versturen**

**Mogelijke Fouten:**

#### **1. "Edge function returned non-2xx status"**
```javascript
// Check console voor details:
Send result: { data: null, error: { message: "..." } }
```

**Oplossingen:**
- Edge function niet deployed → `supabase functions deploy smtp-send`
- SMTP credentials incorrect → Check `smtp_host`, `smtp_port`, `smtp_username`, `smtp_password`
- SMTP niet enabled → Check email provider settings

#### **2. "Authentication failed"**
**Voor Gmail:**
- Je MOET een App Password gebruiken (niet je normale wachtwoord)
- https://myaccount.google.com/apppasswords
- 2FA moet enabled zijn

**Voor Outlook:**
- "Let apps use SMTP AUTH" moet enabled zijn
- App Password gebruiken

#### **3. "Connection refused"**
- Check firewall
- Check SMTP port (587 voor TLS, 465 voor SSL)
- Check internet verbinding

---

## ✅ **SNELLE TEST:**

### **1. Test SMTP Verbinding**
Gebruik de "Test Verbinding" knop in SMTP config dialog.

### **2. Test Email Versturen**
```javascript
// Open console en run:
const { data, error } = await supabase.functions.invoke('smtp-send', {
  body: {
    accountId: '<your-account-id>',
    to: 'test@example.com',
    subject: 'Test',
    body: 'Test message'
  }
});
console.log({ data, error });
```

### **3. Test IMAP Sync**
```javascript
// Open console en run:
const { data, error } = await supabase.functions.invoke('imap-sync', {
  body: { accountId: '<your-account-id>' }
});
console.log({ data, error });
```

---

## 📊 **VERWACHTE FLOW:**

### **Eerste Keer:**
1. ✅ Verbind SMTP account
2. ✅ Klik refresh → IMAP sync haalt emails op
3. ✅ Zie emails verschijnen in lijst
4. ✅ Klik "Nieuwe Email" → Verstuur test email
5. ✅ Check of email is verzonden (inbox van ontvanger)

### **Dagelijks Gebruik:**
1. Open Email tab → Zie bestaande emails
2. Klik refresh → Haal nieuwe emails op
3. Klik email → Lees email
4. Klik "Nieuwe Email" → Verstuur antwoord

---

## 🔐 **SECURITY CHECKLIST:**

- ✅ Provider constraint fix applied (`smtp` toegestaan)
- ✅ Edge functions deployed
- ✅ Database kolommen toegevoegd
- ✅ App Password gebruikt (niet normaal wachtwoord)
- ✅ TLS/SSL enabled

---

## 📞 **SUPPORT:**

Bij problemen check:
1. **Browser Console** (F12) voor errors
2. **Supabase Edge Function Logs** voor server errors
3. **Database tables** voor data issues
4. **Email provider docs** voor SMTP/IMAP settings

