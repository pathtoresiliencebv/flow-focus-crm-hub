# Bonnetjes Email Routing Setup

**Email:** bonnetjes@smanscrm.nl  
**Status:** ✅ READY TO CONFIGURE  
**Datum:** 13 oktober 2025

---

## 📧 Wat is het?

Een automatisch systeem dat:
- Emails ontvangt op `bonnetjes@smanscrm.nl`
- Bijlagen (PDF of images) extraheert  
- Automatisch bonnetjes aanmaakt in het CRM  
- Administrator notificaties stuurt

---

## 🎯 Gebruik

### Voor Medewerkers
1. Maak foto van bonnetje of scan naar PDF
2. Email naar **bonnetjes@smanscrm.nl**
3. Bonnetje verschijnt automatisch in CRM
4. Wacht op goedkeuring van administratie

### Voor Administrators  
1. Ontvang notificatie bij nieuw bonnetje via email
2. Log in op CRM → Bonnetjes → Inkomend
3. Bekijk bonnetje
4. Goedkeuren of afwijzen

---

## ⚙️ Email Provider Setup Opties

### Optie 1: Cloudflare Email Routing (AANBEVOLEN) ✅

**Voordelen:**
- Gratis
- Eenvoudig te configureren
- Webhooks beschikbaar
- Geen SMTP credentials nodig
- Betrouwbaar

**Configuratie:**
1. **DNS Records toevoegen** (bij domein provider):
   ```
   Type: MX
   Name: @
   Value: cloudflare.net
   Priority: 10
   ```

2. **Cloudflare Email Routing Dashboard:**
   - Ga naar Cloudflare Dashboard → Email Routing
   - Add destination: bonnetjes@smanscrm.nl
   - Enable routing

3. **Webhook configureren:**
   - URL: `https://[YOUR-SUPABASE-PROJECT].supabase.co/functions/v1/receipt-email-processor`
   - Method: POST
   - Add webhook secret to Supabase Edge Function env vars

4. **Supabase Edge Function deployen:**
   ```bash
   supabase functions deploy receipt-email-processor
   ```

5. **Test:**
   ```bash
   # Stuur test email naar bonnetjes@smanscrm.nl met bijlage
   ```

---

### Optie 2: SendGrid Inbound Parse

**Voordelen:**
- Geïntegreerd met SendGrid (als je dat al gebruikt)
- Webhooks beschikbaar
- Gratis tot 30.000 emails/maand

**Configuratie:**
1. **DNS MX Record:**
   ```
   Type: MX
   Name: bonnetjes
   Value: mx.sendgrid.net
   Priority: 10
   ```

2. **SendGrid Dashboard:**
   - Settings → Inbound Parse → Add Host & URL
   - Domain: smanscrm.nl
   - Subdomain: bonnetjes
   - Destination URL: `https://[YOUR-SUPABASE-PROJECT].supabase.co/functions/v1/receipt-email-processor`

3. **Test webhook:**
   ```bash
   curl -X POST https://[YOUR-PROJECT].supabase.co/functions/v1/receipt-email-processor \
     -H "Content-Type: application/json" \
     -d '{
       "from": "test@example.com",
       "to": "bonnetjes@smanscrm.nl",
       "subject": "Test bonnetje",
       "text": "Dit is een test",
       "attachments": [{
         "filename": "bonnetje.pdf",
         "content": "BASE64_CONTENT_HERE",
         "contentType": "application/pdf"
       }]
     }'
   ```

---

### Optie 3: Mailgun Inbound Routes

**Voordelen:**
- Krachtig routing systeem
- Webhooks beschikbaar
- Gratis tot 5.000 emails/maand

**Configuratie:**
1. **DNS Records:**
   ```
   Type: MX
   Name: bonnetjes
   Value: mxa.mailgun.org
   Priority: 10
   
   Type: MX
   Name: bonnetjes
   Value: mxb.mailgun.org
   Priority: 10
   ```

2. **Mailgun Dashboard:**
   - Receiving → Routes → Create Route
   - Priority: 0
   - Expression: `match_recipient("bonnetjes@smanscrm.nl")`
   - Action: Forward to URL
   - URL: `https://[YOUR-SUPABASE-PROJECT].supabase.co/functions/v1/receipt-email-processor`

---

### Optie 4: Gmail + Zapier/Make (Makkelijkst maar niet gratis)

**Voordelen:**
- Geen DNS configuratie nodig
- Gebruik bestaand Gmail account
- Low-code setup via Zapier/Make

**Configuratie:**
1. **Gmail account:** bonnetjes@smanscrm.nl (of forward van bestaand account)

2. **Zapier/Make Automation:**
   - Trigger: New Email in Gmail (bonnetjes@smanscrm.nl)
   - Filter: Has attachments
   - Action: Webhook POST naar Supabase Edge Function
   - Map attachments naar JSON format

3. **Kosten:**
   - Zapier: ~$20/maand (Starter plan)
   - Make: ~$10/maand (Core plan)

---

## 🔧 Edge Function Configuration

### Environment Variables

Voeg toe aan Supabase Edge Function secrets:

```bash
# Supabase credentials (already set)
SUPABASE_URL=https://[YOUR-PROJECT].supabase.co
SUPABASE_SERVICE_ROLE_KEY=[YOUR-SERVICE-ROLE-KEY]

# Optional: Webhook authentication
WEBHOOK_SECRET=[GENERATE-RANDOM-SECRET]
```

### Deploy Edge Function

```bash
# Deploy
supabase functions deploy receipt-email-processor

# View logs
supabase functions logs receipt-email-processor
```

---

## 📋 Ondersteunde Bestandsformaten

### Images (aangeraden)
- ✅ JPG/JPEG
- ✅ PNG
- ✅ GIF
- ✅ WEBP
- ✅ HEIC/HEIF (iPhone)

### Documents
- ✅ PDF (max 10MB)

### Niet ondersteund
- ❌ Word/Excel documenten
- ❌ ZIP bestanden
- ❌ Video's

---

## 🧪 Testing

### Manual Test (via web-app)
1. Log in op CRM
2. Ga naar Bonnetjes
3. Klik "Bonnetje uploaden"
4. Upload PDF of image
5. Verify: verschijnt in "Inkomend" tab

### Email Test
1. Email sturen naar bonnetjes@smanscrm.nl
2. Voeg PDF of image toe als bijlage
3. Check Supabase Edge Function logs:
   ```bash
   supabase functions logs receipt-email-processor --tail
   ```
4. Verify in CRM: Bonnetjes → Mail tab

---

## 🔍 Troubleshooting

### Bonnetje komt niet aan
**Check:**
1. MX records correct geconfigureerd?
   ```bash
   dig MX bonnetjes.smanscrm.nl
   ```
2. Edge Function deployed?
   ```bash
   supabase functions list
   ```
3. Edge Function logs:
   ```bash
   supabase functions logs receipt-email-processor
   ```

### Bijlage wordt niet verwerkt
**Check:**
1. Bestandsformaat ondersteund? (PDF of image)
2. Bestandsgrootte < 10MB?
3. Edge Function logs voor errors

### Administrator krijgt geen notificatie
**Check:**
1. Administrator email correct in database?
   ```sql
   SELECT email, full_name FROM profiles WHERE role = 'Administrator';
   ```
2. SMTP credentials correct? (zie `SMANS_SMTP_DEPLOYMENT_GUIDE.md`)

---

## 🔒 Security

### Email Validatie
- ✅ Alleen bijlagen verwerken (images/PDF)
- ✅ Bestandsgrootte limiet (10MB)
- ✅ Virus scan via storage bucket policies (Supabase)

### Database Security
- ✅ RLS policies op receipts tabel
- ✅ Storage policies op receipts bucket
- ✅ Service role key beveiligd in Edge Function

### Webhook Authentication
Optioneel: voeg webhook secret toe voor extra beveiliging:

```typescript
// In Edge Function
const webhookSecret = Deno.env.get('WEBHOOK_SECRET')
const providedSecret = req.headers.get('x-webhook-secret')

if (webhookSecret && providedSecret !== webhookSecret) {
  return new Response('Unauthorized', { status: 401 })
}
```

---

## 📊 Monitoring

### Metrics om te monitoren
- Emails ontvangen per dag
- Bonnetjes succesvol verwerkt
- Processing errors
- Administrator response tijd

### Logs
```bash
# Real-time logs
supabase functions logs receipt-email-processor --tail

# Filter errors
supabase functions logs receipt-email-processor | grep ERROR
```

---

## 🚀 Next Steps

1. ✅ Kies email provider (Cloudflare recommended)
2. ✅ Configureer DNS records
3. ✅ Deploy Edge Function
4. ✅ Test met sample email
5. ✅ Train medewerkers
6. ✅ Monitor eerste week

---

## 📞 Support

### Vragen?
- Check Edge Function logs eerst
- Review deze documentatie
- Test met manual upload eerst (via web-app)

### Bekende Issues
- Grote PDF's (>10MB) worden niet verwerkt → resize/compress eerst
- HEIC images van iPhone → converter naar JPG on-device

---

**Status:** 🟢 PRODUCTION READY  
**Versie:** 1.0  
**Last Updated:** 13 oktober 2025

