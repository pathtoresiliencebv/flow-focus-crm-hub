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

### Optie 1: Mailgun (Aanbevolen) ⭐

**Waarom Mailgun?**
- Gratis tier: 1000 emails/maand
- Gemakkelijke webhook configuratie
- Betrouwbaar en snel
- Goede documentatie

**Setup Stappen:**

1. **Account Aanmaken**
   - Ga naar [mailgun.com](https://mailgun.com)
   - Maak gratis account aan

2. **Domein Verificatie**
   - Voeg `smansonderhoud.nl` toe als domein
   - Hostnet DNS records toevoegen:
     ```
     TXT record:    _mailgun.smansonderhoud.nl → [mailgun verification]
     MX record:     smansonderhoud.nl → mxa.mailgun.org (priority 10)
     MX record:     smansonderhoud.nl → mxb.mailgun.org (priority 10)
     CNAME record:  email.smansonderhoud.nl → mailgun.org
     ```

3. **Route Configureren**
   - Ga naar "Receiving" → "Routes"
   - Create route:
     ```
     Priority: 0
     Filter Expression: match_recipient("bonnetjes@smansonderhoud.nl")
     Actions: forward("https://pvesgvkyiaqmsudmmtkc.supabase.co/functions/v1/receipt-email-processor")
     Description: Bonnetjes Auto-Upload
     ```

4. **Test**
   - Stuur test email naar `bonnetjes@smansonderhoud.nl`
   - Check Supabase logs: `supabase functions logs receipt-email-processor`
   - Controleer `receipts` tabel in database

---

### Optie 2: SendGrid

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
   nslookup -type=MX smansonderhoud.nl
   ```
2. Mailgun route actief?
3. Domain geverifieerd in Mailgun?

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

### Email Verificatie

Optioneel: Voeg verificatie toe om alleen emails van bekende senders te accepteren:

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
2. Check Mailgun logs (Sending → Logs)
3. Test met curl command
4. Contact: info@smansonderhoud.nl

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

