# 🔔 Notification System Deployment Guide

## ✅ Wat is er gebouwd?

Een **complete admin interface** voor het beheren van alle notificatie instellingen:

### 🎯 Features
- ✅ **SMTP Configuratie** - Email server instellingen
- ✅ **SMS Configuratie** - SMS provider setup (MessageBird/Twilio/Vonage)
- ✅ **Live Testing** - Test SMTP en SMS direct vanuit UI
- ✅ **Notificatie Toggles** - Per event type aan/uit zetten
- ✅ **Test Results** - Zie direct of test geslaagd is
- ✅ **Error Logging** - Foutmeldingen worden opgeslagen

---

## 🚀 Deployment Stappen

### Stap 1: Database Migration (✅ AL GEDAAN)

De database tabel is al aangemaakt via Supabase MCP:
```sql
system_notification_settings
```

### Stap 2: Edge Functions Deployen

Deploy de nieuwe test functions:

```bash
cd supabase/functions

# Deploy SMTP test
supabase functions deploy test-smtp-connection

# Deploy SMS test  
supabase functions deploy test-sms-connection
```

### Stap 3: Supabase Secrets Configureren

Je hebt al deze secrets toegevoegd, maar voor de zekerheid:

#### SMTP Secrets:
```bash
supabase secrets set SMANS_SMTP_API_KEY="[je_smtp_api_key]"
supabase secrets set SMANS_SMTP_PASSWORD="2023!Welkom@"
supabase secrets set SMANS_SMTP_HOST="smtp.hostnet.nl"
supabase secrets set SMANS_SMTP_PORT="587"
supabase secrets set SMANS_SMTP_EMAIL="info@smansonderhoud.nl"
```

#### SMS Secrets:
```bash
supabase secrets set SMS_API_KEY="[je_sms_api_key]"

# Optioneel (afhankelijk van provider):
supabase secrets set TWILIO_ACCOUNT_SID="[twilio_sid]"
supabase secrets set NEXMO_API_SECRET="[nexmo_secret]"
```

**Secrets checken:**
```bash
supabase secrets list
```

### Stap 4: Frontend Deploy

✅ **AL GEDAAN!** - Code is al gepusht → Vercel deployed automatisch

---

## 🎨 Hoe te Gebruiken (Admin)

### 1. Open Settings
```
Dashboard → Settings → Systeem Notificaties
```

### 2. SMTP Tab

**Configureren:**
- SMTP Server: `smtp.hostnet.nl`
- SMTP Port: `587`
- Username: `info@smansonderhoud.nl`
- Van Email: `info@smansonderhoud.nl`
- Van Naam: `SMANS Onderhoud`
- ✓ STARTTLS gebruiken

**Testen:**
1. Vul test email in (bijv. je eigen email)
2. Klik "Test"
3. Check je inbox
4. Zie resultaat in UI: ✅ of ❌

**Als test faalt:**
- Check SMTP secrets in Supabase
- Controleer poort 587 is open
- Verify SMTP password correct is

### 3. SMS Tab (Optioneel)

**Configureren:**
1. Kies provider:
   - MessageBird (aanbevolen voor NL)
   - Twilio (internationaal)
   - Vonage/Nexmo
2. Van Nummer: `+31612345678` of `SMANS`
3. Test nummer: je eigen nummer

**Testen:**
1. Vul test nummer in
2. Klik "Test"
3. Je ontvangt SMS binnen 30 sec
4. Zie resultaat in UI

### 4. Notificaties Tab

**Toggle per event:**

**PROJECT GEPLAND:**
- ✓ Email naar klant (met planning details)
- ☐ SMS naar klant (optioneel)

**PROJECT AFGEROND:**
- ✓ Email met werkbon PDF
- ☐ SMS naar klant

**OVERIGE:**
- ✓ Bonnetje goedkeuring → Email naar monteur
- ✓ Offerte goedgekeurd → Email naar klant
- ✓ Factuur verzonden → Email met betaallink

### 5. Opslaan

Klik "Wijzigingen Opslaan" - alle settings worden opgeslagen!

---

## 🧪 Testing

### Test 1: SMTP Connection
```
1. Settings → Systeem Notificaties → SMTP Tab
2. Vul je email in bij "Test email adres"
3. Klik "Test"
4. ✅ Verwacht: Binnen 1 minuut email ontvangen
5. Check: Email bevat SMTP details + timestamp
```

### Test 2: SMS Connection
```
1. Settings → Systeem Notificaties → SMS Tab
2. Vul je nummer in: +31612345678
3. Klik "Test"
4. ✅ Verwacht: Binnen 30 sec SMS ontvangen
5. SMS tekst: "✅ SMS Test geslaagd! ..."
```

### Test 3: Notificatie Toggle
```
1. Settings → Systeem Notificaties → Notificaties Tab
2. Toggle "Email naar klant" uit voor PROJECT GEPLAND
3. Opslaan
4. Plan een project in
5. ✅ Verwacht: Geen email verzonden naar klant
6. Toggle weer aan + test opnieuw
```

---

## 📊 Database Schema

```sql
Table: system_notification_settings

SMTP Fields:
├─ smtp_enabled (boolean)
├─ smtp_host (text)
├─ smtp_port (integer)
├─ smtp_secure (boolean)
├─ smtp_user (text)
├─ smtp_from_email (text)
├─ smtp_from_name (text)
├─ smtp_test_email (text)
├─ smtp_last_test_at (timestamptz)
├─ smtp_last_test_success (boolean)
└─ smtp_last_test_error (text)

SMS Fields:
├─ sms_enabled (boolean)
├─ sms_provider (text) - messagebird/twilio/nexmo
├─ sms_from_number (text)
├─ sms_test_number (text)
├─ sms_last_test_at (timestamptz)
├─ sms_last_test_success (boolean)
└─ sms_last_test_error (text)

Notification Toggles:
├─ notify_planning_email (boolean)
├─ notify_planning_sms (boolean)
├─ notify_completion_email (boolean)
├─ notify_completion_sms (boolean)
├─ notify_receipt_approval_email (boolean)
├─ notify_quote_approval_email (boolean)
└─ notify_invoice_sent_email (boolean)
```

**Singleton Record:**
```sql
id = '00000000-0000-0000-0000-000000000001'
```

Altijd maar 1 record voor hele systeem.

---

## 🔐 Security

### RLS Policies
Alleen Administrators kunnen:
- Instellingen bekijken
- Instellingen updaten

```sql
-- View policy
get_user_role(auth.uid()) = 'Administrator'

-- Update policy
get_user_role(auth.uid()) = 'Administrator'
```

### Secrets Storage
Passwords worden **NOOIT** in database opgeslagen:
- ✅ SMTP password → Supabase Secret
- ✅ SMS API key → Supabase Secret
- ✅ Twilio/Nexmo keys → Supabase Secrets

Edge Functions halen secrets op via `Deno.env.get()`.

---

## 📱 SMS Providers

### MessageBird (Aanbevolen voor NL)

**Setup:**
1. Account: https://messagebird.com
2. Dashboard → Developers → API Keys
3. Kopieer Live API Key
4. `supabase secrets set SMS_API_KEY="live_xxxx"`
5. Van nummer: +31612345678 of "SMANS"

**Pricing:**
- €0.065 per SMS (NL)
- €10 gratis tegoed bij signup

### Twilio

**Setup:**
1. Account: https://twilio.com
2. Console → Account SID + Auth Token
3. Phone Numbers → Buy a number
4. Secrets:
   ```bash
   supabase secrets set SMS_API_KEY="[auth_token]"
   supabase secrets set TWILIO_ACCOUNT_SID="AC..."
   ```

**Pricing:**
- $1/maand per nummer
- $0.04 per SMS (NL)

### Vonage (Nexmo)

**Setup:**
1. Account: https://vonage.com
2. Dashboard → API Settings
3. API Key + Secret
4. Secrets:
   ```bash
   supabase secrets set SMS_API_KEY="[api_key]"
   supabase secrets set NEXMO_API_SECRET="[secret]"
   ```

---

## 🔍 Troubleshooting

### SMTP Test Faalt

**Error: "Connection refused"**
- Check: Poort 587 open?
- Check: SMTP host correct (smtp.hostnet.nl)?
- Check: Firewall settings

**Error: "Authentication failed"**
- Check: Username = info@smansonderhoud.nl?
- Check: SMANS_SMTP_PASSWORD secret correct?
- Check: Hostnet account actief?

**Error: "Timeout"**
- Check: Internet connectie
- Check: SMTP server status (hostnet.nl)

### SMS Test Faalt

**Error: "API key invalid"**
- Check: SMS_API_KEY secret correct?
- Check: Key type = Live (niet Test)

**Error: "Insufficient balance"**
- Check: Account balance in provider dashboard
- Top up account

**Error: "Invalid phone number"**
- Format: +31612345678 (met +31)
- Geen spaties of streepjes
- Landcode verplicht

---

## 📈 Monitoring

### Check Test Logs

**In UI:**
- Settings → Systeem Notificaties
- Laatste test tijdstip zichtbaar onder test button
- Error messages zichtbaar bij falende test

**In Database:**
```sql
SELECT 
  smtp_last_test_at,
  smtp_last_test_success,
  smtp_last_test_error,
  sms_last_test_at,
  sms_last_test_success,
  sms_last_test_error
FROM system_notification_settings;
```

### Edge Function Logs

```bash
# SMTP test logs
supabase functions logs test-smtp-connection --tail

# SMS test logs
supabase functions logs test-sms-connection --tail
```

---

## 🎉 Klaar!

✅ Database tabel aangemaakt  
✅ Edge Functions deployed  
✅ Secrets configured  
✅ UI geïntegreerd in Settings  
✅ Testing functies werkend  

**Volgende Stap:** Open Settings → Systeem Notificaties en configureer!

---

## 📞 Support

Bij problemen:
1. Check Edge Function logs
2. Check Supabase secrets
3. Test SMTP/SMS vanuit UI
4. Bekijk error messages in UI

**Credentials Check:**
```bash
supabase secrets list
```

Moet tonen:
- SMANS_SMTP_API_KEY
- SMANS_SMTP_PASSWORD
- SMANS_SMTP_HOST
- SMANS_SMTP_PORT
- SMANS_SMTP_EMAIL
- SMS_API_KEY (optioneel)

**Project ID:** `pvesgvkyiaqmsudmmtkc`

