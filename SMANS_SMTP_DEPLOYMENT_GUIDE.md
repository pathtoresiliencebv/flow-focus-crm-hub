# 📧 SMANS SMTP CONFIGURATIE - DEPLOYMENT GUIDE

## 📋 OVERZICHT

Alle emails van het SMANS CRM systeem worden nu verstuurd via:

**Email Account:** `info@smansonderhoud.nl`  
**SMTP Server:** `smtp.hostnet.nl`  
**Port:** `587` (STARTTLS)  
**IMAP Server:** `imap.hostnet.nl`  
**Port:** `993` (SSL)

---

## 🎯 CENTRALE EMAIL SENDER

Alle email functionaliteit gaat nu via **één gecentraliseerde Edge Function**: `send-email-smans`

**Wat deze functie doet:**
- ✅ Gebruikt ALTIJD de SMANS SMTP credentials
- ✅ Ondersteunt HTML en plain text emails
- ✅ Ondersteunt attachments (PDF, iCal, etc.)
- ✅ Ondersteunt CC en BCC
- ✅ STARTTLS beveiliging
- ✅ Proper MIME encoding

**Welke functies gebruiken deze:**
1. `send-completion-email` - Werkbon emails naar klanten
2. `send-planning-notification` - Planning bevestigingen met iCal
3. `send-planning-reminder` - 24h herinneringen

---

## 🚀 DEPLOYMENT STAPPEN

### **STAP 1: Supabase Secrets Configureren**

De SMTP credentials worden veilig opgeslagen als Supabase secrets (NIET in code!).

```bash
# Login bij Supabase CLI
supabase login

# Link je project (als nog niet gedaan)
supabase link --project-ref YOUR_PROJECT_REF

# Stel de secrets in
supabase secrets set SMANS_SMTP_EMAIL="info@smansonderhoud.nl"
supabase secrets set SMANS_SMTP_PASSWORD="2023!Welkom@"

# Verifieer dat secrets zijn ingesteld
supabase secrets list
```

**Expected output:**
```
NAME                    VALUE
SMANS_SMTP_EMAIL       inf***********l
SMANS_SMTP_PASSWORD    202***********@
```

---

### **STAP 2: Edge Functions Deployen**

Deploy alle email-gerelateerde Edge Functions:

```bash
# Deploy de centrale SMANS email sender (BELANGRIJK!)
supabase functions deploy send-email-smans

# Deploy completion email handler
supabase functions deploy send-completion-email

# Deploy planning notification handler
supabase functions deploy send-planning-notification

# Deploy planning reminder handler (scheduled)
supabase functions deploy send-planning-reminder --no-verify-jwt
```

**⚠️ Belangrijk:**
- `send-email-smans` moet EERST gedeployed worden
- `send-planning-reminder` heeft `--no-verify-jwt` nodig (scheduled functie)

---

### **STAP 3: Verifiëren dat Functions zijn Deployed**

Check in Supabase Dashboard:

1. Ga naar **Edge Functions** sectie
2. Controleer dat volgende functies actief zijn:
   - ✅ `send-email-smans`
   - ✅ `send-completion-email`
   - ✅ `send-planning-notification`
   - ✅ `send-planning-reminder`

---

### **STAP 4: Test Email Sending**

#### Test 1: Directe SMANS Email Sender

```bash
curl -X POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-email-smans' \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "jouw.email@example.com",
    "subject": "Test Email van SMANS CRM",
    "html": "<h1>Test Email</h1><p>Dit is een test email van het SMANS CRM systeem.</p><p>Als je dit ontvangt, werkt de SMTP configuratie correct!</p>"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Email sent successfully",
  "from": "info@smansonderhoud.nl",
  "to": ["jouw.email@example.com"],
  "subject": "Test Email van SMANS CRM"
}
```

#### Test 2: Completion Email (met PDF attachment)

```bash
curl -X POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-completion-email' \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "completionId": "test-123",
    "customerEmail": "jouw.email@example.com",
    "customerName": "Test Klant",
    "projectTitle": "Test Project",
    "projectAddress": "Teststraat 123, Amsterdam",
    "monteurName": "Jan Smans",
    "completionDate": "2025-01-08",
    "customerSatisfaction": 5,
    "workPerformed": "Test werkzaamheden voltooid",
    "pdfUrl": "https://your-storage-url/test.pdf"
  }'
```

#### Test 3: Planning Notification (met iCal)

```bash
curl -X POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-planning-notification' \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "planningId": "EXISTING_PLANNING_ID",
    "customerId": "EXISTING_CUSTOMER_ID",
    "notificationType": "planning_created",
    "channel": "email"
  }'
```

---

### **STAP 5: Check Edge Function Logs**

Monitor de logs om te zien of emails succesvol worden verstuurd:

```bash
# Watch logs van send-email-smans
supabase functions logs send-email-smans --follow

# Watch logs van send-completion-email
supabase functions logs send-completion-email --follow

# Watch logs van send-planning-notification
supabase functions logs send-planning-notification --follow
```

**Wat je zou moeten zien:**
```
🔌 Connecting to smtp.hostnet.nl:587...
✅ Connected to SMTP server
🔐 Starting TLS...
✅ TLS established
🔑 Authenticating...
✅ Authenticated
📧 Sending email from SMANS: ...
✅ Email sent successfully via SMANS SMTP
```

---

## 🔧 TROUBLESHOOTING

### Probleem: "SMANS_SMTP_PASSWORD not configured"

**Oplossing:**
```bash
# Check of secrets zijn ingesteld
supabase secrets list

# Zet secrets opnieuw
supabase secrets set SMANS_SMTP_PASSWORD="2023!Welkom@"

# Redeploy de functie
supabase functions deploy send-email-smans
```

---

### Probleem: "SMTP Error 535: Authentication failed"

**Mogelijke oorzaken:**
1. ❌ Verkeerd wachtwoord
2. ❌ Email blocked door Hostnet
3. ❌ Te veel login pogingen

**Oplossing:**
```bash
# Verifieer credentials handmatig
telnet smtp.hostnet.nl 587
# EHLO smanscrm.nl
# STARTTLS
# AUTH LOGIN
# [base64 van info@smansonderhoud.nl]
# [base64 van 2023!Welkom@]

# Als authenticatie faalt, check wachtwoord bij Hostnet
# Reset wachtwoord indien nodig via Hostnet control panel
```

---

### Probleem: "Connection timeout"

**Oplossing:**
- Check of smtp.hostnet.nl bereikbaar is
- Verifieer dat port 587 open staat
- Test vanuit lokale terminal:

```bash
openssl s_client -connect smtp.hostnet.nl:587 -starttls smtp
```

---

### Probleem: Email wordt niet ontvangen

**Check deze dingen:**
1. ✅ Check spam folder
2. ✅ Check Edge Function logs (fouten?)
3. ✅ Check of email adres correct is
4. ✅ Test met ander email adres
5. ✅ Check Hostnet webmail (verstuurde items)

---

## 📊 MONITORING

### Edge Function Invocations

Check in **Supabase Dashboard → Edge Functions → Metrics**:
- Totaal invocations per functie
- Error rate
- Response time
- Success rate

### Email Delivery Tracking

Check in database:
```sql
-- Check recent completion emails
SELECT 
  id,
  customer_email,
  email_sent_at,
  status,
  created_at
FROM project_completions
WHERE email_sent_at IS NOT NULL
ORDER BY email_sent_at DESC
LIMIT 20;

-- Check planning notifications
SELECT 
  id,
  customer_id,
  notification_type,
  channel,
  status,
  sent_at,
  delivered_at,
  recipient_email
FROM customer_notifications
WHERE channel = 'email'
ORDER BY sent_at DESC
LIMIT 20;
```

---

## 🔐 SECURITY BEST PRACTICES

### ✅ **DO:**
- Store credentials in Supabase Secrets
- Use STARTTLS (port 587)
- Rotate passwords periodically
- Monitor for suspicious activity
- Rate limit emails if needed

### ❌ **DON'T:**
- Hardcode credentials in code
- Commit credentials to git
- Share secrets in chat/email
- Use unencrypted connections
- Expose service role key to frontend

---

## 📝 SMTP CREDENTIALS REFERENCE

```
Provider: Hostnet
Account: info@smansonderhoud.nl

SMTP:
- Host: smtp.hostnet.nl
- Port: 587
- Encryption: STARTTLS
- Username: info@smansonderhoud.nl
- Password: 2023!Welkom@

IMAP (voor toekomst):
- Host: imap.hostnet.nl
- Port: 993
- Encryption: SSL/TLS
- Username: info@smansonderhoud.nl
- Password: 2023!Welkom@
```

**⚠️ Deze credentials zijn vertrouwelijk! Niet delen!**

---

## 🎯 WHAT'S NEXT?

### Toekomstige Email Features:
1. ⏳ Email tracking (opens, clicks)
2. ⏳ Email templates systeem
3. ⏳ Bulk email sending
4. ⏳ Email scheduling
5. ⏳ IMAP integration voor inbox
6. ⏳ Email threads/conversations
7. ⏳ Attachments van Supabase Storage
8. ⏳ Reply-to handling

---

## 📞 SUPPORT

**Bij problemen:**
1. Check deze guide eerst
2. Check Edge Function logs
3. Test met curl commands
4. Check Hostnet status
5. Contact Hostnet support indien nodig

**Hostnet Support:**
- Website: https://www.hostnet.nl
- Email: support@hostnet.nl
- Telefoon: +31 (0)70 - 820 00 00

---

## ✅ CHECKLIST VOOR GO-LIVE

- [ ] Supabase secrets zijn ingesteld
- [ ] `send-email-smans` is deployed
- [ ] `send-completion-email` is deployed
- [ ] `send-planning-notification` is deployed
- [ ] `send-planning-reminder` is deployed
- [ ] Test email ontvangen via `send-email-smans`
- [ ] Test completion email met PDF attachment
- [ ] Test planning notification met iCal
- [ ] Edge Function logs laten geen errors zien
- [ ] Email komt aan in inbox (niet spam)
- [ ] Email from address is `info@smansonderhoud.nl`
- [ ] PDF attachments werken correct
- [ ] iCal attachments werken correct
- [ ] Alle email templates zien er professioneel uit

**Als alle checks groen zijn: 🚀 GO LIVE!**

---

**Laatste Update:** 8 januari 2025  
**Versie:** 1.0  
**Contact:** SMANS BV Development Team

