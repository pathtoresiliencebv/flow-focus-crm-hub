# 📧 Email Bonnetjes Automatisering - Setup Guide

## Overzicht

Dit document beschrijft hoe je `bonnetjes@smansonderhoud.nl` configureert zodat bonnetjes automatisch worden verwerkt wanneer ze per email worden verstuurd.

---

## ✅ Wat is al klaar?

- ✅ Edge Function: `receipt-email-processor` is deployed
- ✅ Storage bucket: `receipts` is actief
- ✅ Database table: `receipts` met status workflow
- ✅ Admin notificaties: Automatische email naar admins
- ✅ Webhook endpoint: Ready voor Brevo

---

## 📋 Setup Stappen

### **STAP 1: Brevo Inbound Email Configureren**

1. **Log in bij Brevo** (SendinBlue)
   - Ga naar: https://app.brevo.com
   - Log in met SMANS account credentials

2. **Navigeer naar Inbound Parsing**
   - Klik op **Transactional** in het menu
   - Selecteer **Settings** → **Inbound Parsing**

3. **Voeg Webhook URL toe**
   ```
   https://pvesgvkyiaqmsudmmtkc.supabase.co/functions/v1/receipt-email-processor
   ```

4. **Configureer Email Adres**
   - Email: `bonnetjes@smansonderhoud.nl`
   - Beschrijving: "Automatische bonnetjes verwerking"
   - Webhook URL: (zie stap 3)
   - Method: `POST`

5. **Test Webhook**
   - Brevo heeft een "Test" knop
   - Klik hierop om te verifiëren dat de webhook bereikbaar is
   - Expected response: `200 OK`

---

### **STAP 2: DNS Records Configureren**

Voor Brevo inbound email moet je DNS records toevoegen:

**MX Record:**
```
Type: MX
Host: bonnetjes (of bonnetjes.smansonderhoud.nl)
Value: in.mailhw.net
Priority: 10
TTL: 3600
```

**TXT Record (SPF):**
```
Type: TXT
Host: bonnetjes (of bonnetjes.smansonderhoud.nl)
Value: v=spf1 include:spf.sendinblue.com ~all
TTL: 3600
```

> ⚠️ **Let op:** DNS propagatie kan 24-48 uur duren

---

### **STAP 3: Verificatie**

1. **Wacht op DNS propagatie**
   - Check DNS met: `nslookup -type=MX bonnetjes.smansonderhoud.nl`
   - Verwachte output: `in.mailhw.net`

2. **Test Email Verzenden**
   - Stuur een test email naar: `bonnetjes@smansonderhoud.nl`
   - Voeg 1 of meerdere foto's toe als attachment
   - Formaten: JPG, PNG, GIF, WEBP

3. **Controleer Verwerking**
   - Check Supabase logs: Edge Function logs
   - Check receipts table: Nieuwe records?
   - Check admin inbox: Notificatie email?

---

## 🔧 Hoe Het Werkt

### **Workflow:**

```
1. Email → bonnetjes@smansonderhoud.nl
           ↓
2. Brevo ontvangt email
           ↓
3. Brevo parse attachments
           ↓
4. Brevo POST naar webhook
           ↓
5. Edge Function: receipt-email-processor
           ↓
6. Upload naar Supabase Storage (receipts bucket)
           ↓
7. Insert record in receipts table (status: pending)
           ↓
8. Stuur notificatie naar alle admins
           ↓
9. Admin keurt goed/af in CRM
```

---

## 📊 Brevo Webhook Payload Format

Brevo stuurt de volgende data naar de webhook:

```json
{
  "from": "monteur@example.com",
  "to": "bonnetjes@smansonderhoud.nl",
  "subject": "Bonnetje project X",
  "text": "Email body text",
  "html": "<p>Email body HTML</p>",
  "attachments": [
    {
      "filename": "bonnetje.jpg",
      "content": "base64_encoded_content_here...",
      "contentType": "image/jpeg",
      "size": 123456
    }
  ]
}
```

---

## ✅ Edge Function Details

**Functie:** `receipt-email-processor`

**Capabilities:**
- ✅ Accepteert Brevo webhook POST requests
- ✅ Verwerkt alleen image attachments (JPG, PNG, GIF, WEBP)
- ✅ Uploadt naar `receipts` storage bucket
- ✅ Maakt receipt record met status `pending`
- ✅ Stuurt notificatie naar alle admins
- ✅ Graceful error handling

**Response Codes:**
- `200` - Success (webhook processed)
- `200` - No attachments (prevents retry)
- `500` - Server error

---

## 🧪 Test Scenario's

### **Test 1: Email met 1 foto**
```
Van: test@example.com
Aan: bonnetjes@smansonderhoud.nl
Onderwerp: Test bonnetje
Attachment: foto.jpg (1.2 MB)

Expected:
- ✅ 1 receipt record created
- ✅ File uploaded: email-{timestamp}-foto.jpg
- ✅ Status: pending
- ✅ Admin email sent
```

### **Test 2: Email met meerdere foto's**
```
Van: monteur@smansonderhoud.nl
Aan: bonnetjes@smansonderhoud.nl
Onderwerp: Bonnetjes project 123
Attachments: 
  - bon1.jpg
  - bon2.png
  - bon3.jpg

Expected:
- ✅ 3 receipt records created
- ✅ All files uploaded
- ✅ Status: pending (all)
- ✅ Admin email sent (1x with count)
```

### **Test 3: Email met PDF (non-image)**
```
Van: test@example.com
Aan: bonnetjes@smansonderhoud.nl
Attachment: document.pdf

Expected:
- ✅ PDF skipped (only images)
- ✅ No receipt created
- ✅ No admin email
- ✅ 200 OK response (prevent retry)
```

---

## 🔐 Security

**Authentication:**
- Webhook is public (POST only)
- Brevo IP whitelist (optional, maar niet nodig)
- Edge Function heeft CORS headers

**Data:**
- Attachments: base64 decoded
- Storage: Private bucket (signed URLs)
- Database: RLS policies actief

---

## 📝 Admin Workflow

1. **Notificatie Ontvangen**
   - Email: "📧 Nieuwe bonnetjes ontvangen via email"
   - Van: noreply@supabase
   - Aan: Alle admins

2. **Check Receipts**
   - Login CRM
   - Ga naar Bonnetjes/Receipts sectie
   - Filter: Status = Pending

3. **Goedkeuren/Afkeuren**
   - Open receipt
   - Bekijk foto
   - Koppel aan project (optioneel)
   - Status: Approved / Rejected

---

## 🐛 Troubleshooting

### **Geen emails ontvangen?**
1. Check DNS records (MX + SPF)
2. Check Brevo inbound parsing config
3. Test met: `nslookup -type=MX bonnetjes.smansonderhoud.nl`

### **Webhook niet triggered?**
1. Check Brevo webhook URL
2. Check Edge Function logs in Supabase
3. Test webhook met Postman/Insomnia

### **Attachments niet geüpload?**
1. Check attachment contentType (moet image/* zijn)
2. Check storage bucket: `receipts`
3. Check Edge Function logs voor errors

### **Admins krijgen geen email?**
1. Check SMTP settings in Supabase
2. Check send-email-smans Edge Function
3. Check profiles table: role = 'Administrator'

---

## 📞 Support

**Brevo Support:**
- Email: support@brevo.com
- Docs: https://developers.brevo.com/docs/inbound-parsing

**Supabase Support:**
- Dashboard: https://app.supabase.com/project/pvesgvkyiaqmsudmmtkc
- Edge Functions: https://app.supabase.com/project/pvesgvkyiaqmsudmmtkc/functions
- Storage: https://app.supabase.com/project/pvesgvkyiaqmsudmmtkc/storage/buckets

---

## ✅ Checklist

Voordat je live gaat:

- [ ] Brevo account actief
- [ ] Inbound parsing geconfigureerd
- [ ] Webhook URL toegevoegd
- [ ] DNS records toegevoegd (MX + SPF)
- [ ] DNS propagatie voltooid (24-48u)
- [ ] Test email verzonden
- [ ] Receipt record aangemaakt
- [ ] Admin notificatie ontvangen
- [ ] Edge Function logs checked
- [ ] Storage bucket heeft files

---

## 🚀 Live!

Wanneer alles werkt:
1. ✅ Informeer monteurs over `bonnetjes@smansonderhoud.nl`
2. ✅ Instructie: Foto's van bonnetjes doorsturen naar dit adres
3. ✅ Admins worden automatisch genotificeerd
4. ✅ Goedkeuring via CRM dashboard

**Klaar!** 🎉

