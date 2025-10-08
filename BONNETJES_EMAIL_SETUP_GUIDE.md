# Bonnetjes Email Setup Guide

## 📧 Email Ontvangst Systeem voor Bonnetjes

Dit systeem maakt het mogelijk om bonnetjes (kwitanties, facturen, etc.) automatisch te verwerken door ze te emailen naar `bonnetjes@smansonderhoud.nl`.

---

## 🎯 Hoe Werkt Het?

1. **Gebruiker** stuurt email naar `bonnetjes@smansonderhoud.nl` met foto's als bijlage
2. **Email Service** (Mailgun/SendGrid/CloudMailin) vangt de email op
3. **Webhook** stuurt email data naar Supabase Edge Function
4. **Edge Function** (`receipt-email-processor`) verwerkt de bijlagen:
   - Download foto's uit email
   - Upload naar Supabase Storage (`receipts` bucket)
   - Maak record in `receipts` tabel met status `pending`
5. **Administrators** ontvangen notificatie email
6. **Admin** keurt bonnetjes goed/af in CRM

---

## ⚙️ Setup Opties

Er zijn 3 opties voor het ontvangen van emails:

### Optie 1: Brevo (Aanbevolen) ⭐

**Waarom Brevo?**
- Gratis tier: 300 emails/dag
- Nederlandse interface
- Inbound Email Parsing
- Betrouwbaar en snel
- Goede support

**Setup Stappen:**

1. **Account Aanmaken**
   - Ga naar [brevo.com](https://www.brevo.com) (voorheen SendinBlue)
   - Maak gratis account aan
   - Verifieer email adres

2. **Domein Toevoegen**
   - Ga naar **Settings** → **Senders & IP**
   - Klik **Add a domain**
   - Voer `smansonderhoud.nl` in
   - Kopieer de DNS records

3. **DNS Records in Hostnet**
   Voeg deze records toe via Hostnet control panel:
   ```
   TXT record: smansonderhoud.nl → "brevo-code=XXXXX" (authenticatie)
   TXT record: _dmarc.smansonderhoud.nl → "v=DMARC1; p=none"
   TXT record: brevo._domainkey.smansonderhoud.nl → "DKIM key van Brevo"
   MX record:  bonnetjes.smansonderhoud.nl → mx.smansonderhoud.nl (priority 10)
   ```

4. **Inbound Email Configureren**
   - Ga naar **Settings** → **Inbound parsing**
   - Klik **Add inbound route**
   - Configureer:
     ```
     Email: bonnetjes@smansonderhoud.nl
     Webhook URL: https://pvesgvkyiaqmsudmmtkc.supabase.co/functions/v1/receipt-email-processor
     HTTP Method: POST
     Format: JSON
     ```
   - Activeer **Include attachments**
   - Opslaan

5. **Webhook Headers (Optioneel)**
   Voor extra security:
   ```json
   {
     "X-Brevo-Webhook": "receipt-processor",
     "Content-Type": "application/json"
   }
   ```

6. **Test**
   - Stuur test email naar `bonnetjes@smansonderhoud.nl` met foto
   - Check Supabase logs: `supabase functions logs receipt-email-processor`
   - Controleer `receipts` tabel in database

**Brevo Email Format:**
```json
{
  "items": [{
    "From": "user@example.com",
    "To": "bonnetjes@smansonderhoud.nl",
    "Subject": "Bonnetje",
    "Attachments": [
      {
        "Name": "receipt.jpg",
        "ContentType": "image/jpeg",
        "ContentLength": 45678,
        "Content": "base64-encoded-content-here"
      }
    ]
  }]
}
```

**Belangrijk:**
- DNS propagatie kan 24-48 uur duren
- Test eerst met persoonlijk email adres
- Controleer spam folder als email niet aankomt

---

### Optie 2: Mailgun

**Setup:**

1. Account aanmaken op [mailgun.com](https://mailgun.com)

2. Domain toevoegen en DNS records configureren:
   ```
   MX record: smansonderhoud.nl → mxa.mailgun.org (priority 10)
   MX record: smansonderhoud.nl → mxb.mailgun.org (priority 10)
   ```

3. Route configureren:
   - Filter: `match_recipient("bonnetjes@smansonderhoud.nl")`
   - Webhook: `https://pvesgvkyiaqmsudmmtkc.supabase.co/functions/v1/receipt-email-processor`

---

### Optie 3: SendGrid

**Setup:**

1. Account aanmaken op [sendgrid.com](https://sendgrid.com)

2. Inbound Parse configureren:
   - Ga naar Settings → Inbound Parse
   - Add host & URL
   - Hostname: `bonnetjes.smansonderhoud.nl`
   - Webhook URL: `https://pvesgvkyiaqmsudmmtkc.supabase.co/functions/v1/receipt-email-processor`

3. DNS Records toevoegen (Hostnet):
   ```
   MX record: bonnetjes.smansonderhoud.nl → mx.sendgrid.net (priority 10)
   ```

---

### Optie 3: CloudMailin

**Setup:**

1. Account aanmaken op [cloudmailin.com](https://cloudmailin.com)

2. Address configureren:
   - Target URL: `https://pvesgvkyiaqmsudmmtkc.supabase.co/functions/v1/receipt-email-processor`
   - HTTP POST Format: JSON

3. MX Records:
   ```
   MX record: bonnetjes.smansonderhoud.nl → mx.cloudmailin.net (priority 10)
   ```

---

## 🚀 Deployment

### 1. Deploy Edge Function

```bash
cd supabase/functions
supabase functions deploy receipt-email-processor
```

### 2. Verify Deployment

```bash
# Test de function
curl -X POST \
  https://pvesgvkyiaqmsudmmtkc.supabase.co/functions/v1/receipt-email-processor \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "test@example.com",
    "to": "bonnetjes@smansonderhoud.nl",
    "attachments": [
      {
        "filename": "test.jpg",
        "contentType": "image/jpeg",
        "content": "BASE64_ENCODED_IMAGE_HERE"
      }
    ]
  }'
```

### 3. Check Logs

```bash
supabase functions logs receipt-email-processor --tail
```

---

## 📝 Testing

### Test Email Sturen

1. **Via Gmail/Outlook:**
   - Nieuw bericht naar `bonnetjes@smansonderhoud.nl`
   - Voeg 1-3 foto's toe als bijlage (JPG, PNG)
   - Verstuur

2. **Verwacht Resultaat:**
   - Email wordt ontvangen door Mailgun
   - Mailgun stuurt webhook naar Edge Function
   - Foto's worden geupload naar Storage
   - Records verschijnen in `receipts` tabel
   - Admins ontvangen email notificatie

3. **Check Resultaat:**
   ```sql
   SELECT * FROM receipts 
   WHERE created_at > NOW() - INTERVAL '1 hour'
   ORDER BY created_at DESC;
   ```

---

## 🔧 Troubleshooting

### Email wordt niet ontvangen

**Check:**
1. DNS records correct ingesteld? (use `dig` or `nslookup`)
   ```bash
   nslookup -type=MX bonnetjes.smansonderhoud.nl
   nslookup -type=TXT smansonderhoud.nl
   ```
2. Brevo inbound route actief?
3. Domain geverifieerd in Brevo?
4. Check Brevo Dashboard → Inbound parsing → Status

### Webhook fails

**Check:**
1. Edge Function deployed?
2. Supabase function logs:
   ```bash
   supabase functions logs receipt-email-processor
   ```
3. Webhook URL correct in Mailgun?

### Foto's niet geupload

**Check:**
1. Storage bucket `receipts` bestaat?
2. RLS policies correct?
   ```sql
   -- Check policies
   SELECT * FROM pg_policies WHERE tablename = 'receipts';
   ```
3. Service role key correct?

### Admin notifications niet verzonden

**Check:**
1. Administrator profiles in database?
   ```sql
   SELECT * FROM profiles WHERE role = 'Administrator';
   ```
2. Email addresses correct?
3. `send-email-smans` functie werkt?

---

## 📊 Monitoring

### Logs Bekijken

```bash
# Real-time logs
supabase functions logs receipt-email-processor --tail

# Laatste 100 entries
supabase functions logs receipt-email-processor --limit 100
```

### Database Queries

```sql
-- Aantal bonnetjes per dag
SELECT 
  DATE(created_at) as date,
  COUNT(*) as count,
  status
FROM receipts
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at), status
ORDER BY date DESC;

-- Bonnetjes via email
SELECT *
FROM receipts
WHERE uploaded_by IS NULL  -- Email uploads hebben geen user
ORDER BY created_at DESC
LIMIT 20;
```

---

## 🔐 Security

### Brevo Webhook Verificatie

Optioneel: Verifieer dat requests van Brevo komen:

```typescript
// In receipt-email-processor/index.ts
const brevoSecret = Deno.env.get('BREVO_WEBHOOK_SECRET')
const receivedSignature = req.headers.get('X-Brevo-Signature')

if (brevoSecret && receivedSignature !== brevoSecret) {
  console.warn('⚠️ Invalid Brevo signature')
  return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403 })
}
```

### Email Sender Whitelist

Optioneel: Accepteer alleen emails van bekende senders:

```typescript
// In receipt-email-processor/index.ts
const ALLOWED_SENDERS = [
  'monteur@smansonderhoud.nl',
  'admin@smansonderhoud.nl'
]

if (!ALLOWED_SENDERS.includes(emailData.from)) {
  console.warn('⚠️ Email from unauthorized sender:', emailData.from)
  return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403 })
}
```

### Storage Security

Storage bucket RLS policies:

```sql
-- Alleen authenticated users kunnen receipts lezen
CREATE POLICY "Authenticated users can view receipts"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'receipts');

-- Service role kan uploaden (voor Edge Function)
CREATE POLICY "Service role can upload receipts"
ON storage.objects FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'receipts');
```

---

## 💡 Tips

1. **Email Subject Line:**
   - Voeg project ID toe in onderwerp: "Bonnetje Project-XYZ"
   - Edge Function kan dit parsen en automatisch koppelen

2. **Multiple Attachments:**
   - Maximaal 10 foto's per email aanbevolen
   - Grootte: max 10MB per foto

3. **Supported Formats:**
   - JPG, JPEG
   - PNG
   - GIF
   - WebP

4. **Niet Supported:**
   - PDF (nog niet)
   - HEIC (iPhone photos - convert eerst)
   - Videos

---

## 📞 Support

Bij problemen:
1. Check Supabase function logs
2. Check Brevo logs (Statistics → Inbound)
3. Check Brevo webhook logs
4. Test met curl command
5. Verify DNS propagation (24-48 uur)
6. Contact: info@smansonderhoud.nl

**Brevo Support:**
- Help Center: https://help.brevo.com
- Email: support@brevo.com
- Chat: In dashboard (rechtsonder)

---

## 🎉 Ready to Use!

Na setup:
1. Informeer monteurs over `bonnetjes@smansonderhoud.nl`
2. Test met een paar voorbeeld bonnetjes
3. Monitor eerste week dagelijks
4. Document eventuele issues

**Webhook URL:**
```
https://pvesgvkyiaqmsudmmtkc.supabase.co/functions/v1/receipt-email-processor
```

**Test Email:**
```
bonnetjes@smansonderhoud.nl
```

**Supabase Project:** `pvesgvkyiaqmsudmmtkc`

