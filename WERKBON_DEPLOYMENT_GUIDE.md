# 📦 Werkbon Systeem - Deployment Guide

## 🎯 Overzicht

Deze guide helpt je om het Werkbon PDF Generation systeem volledig operationeel te maken in productie.

---

## ✅ PRE-DEPLOYMENT CHECKLIST

### 1. Database Setup

Alle tabellen zijn al aanwezig via migraties:
- ✅ `project_completions`
- ✅ `completion_photos`
- ✅ `project_tasks`
- ✅ `profiles`
- ✅ `customers`
- ✅ `projects`

### 2. Storage Buckets

Controleer of deze buckets bestaan in Supabase Storage:

```bash
# Via Supabase Dashboard → Storage
- completion-reports (public, voor PDF bestanden)
- completion-photos (public, voor monteur foto's)
```

**Bucket configuratie:**
```sql
-- If buckets don't exist, create them:
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('completion-reports', 'completion-reports', true),
  ('completion-photos', 'completion-photos', true);

-- Set storage policies
CREATE POLICY "Public read access"
  ON storage.objects FOR SELECT
  USING (bucket_id IN ('completion-reports', 'completion-photos'));

CREATE POLICY "Authenticated users can upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id IN ('completion-reports', 'completion-photos') 
    AND auth.role() = 'authenticated'
  );
```

---

## 🔧 EDGE FUNCTIONS DEPLOYMENT

### Stap 1: Deploy Edge Functions

```bash
# Navigate to project directory
cd "G:\Mijn Drive\PROJECTEN\SMANS CRM\flow-focus-crm-hub"

# Deploy generate-work-order function
supabase functions deploy generate-work-order

# Deploy send-completion-email function  
supabase functions deploy send-completion-email

# Verify deployment
supabase functions list
```

### Stap 2: Set Environment Secrets

```bash
# Set Supabase environment variables
supabase secrets set SUPABASE_URL="your-project-url"
supabase secrets set SUPABASE_ANON_KEY="your-anon-key"
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Set SMTP credentials (for email sending)
supabase secrets set SMTP_HOST="smtp.gmail.com"
supabase secrets set SMTP_PORT="587"
supabase secrets set SMTP_USER="your-email@gmail.com"
supabase secrets set SMTP_PASS="your-app-password"
supabase secrets set SMTP_FROM="noreply@smansbv.nl"

# View all secrets
supabase secrets list
```

---

## 📄 PDF GENERATION SETUP

Je hebt **3 opties** voor PDF generatie:

### Option A: HTML2PDF.app (Recommended - Gratis tier)

**Stappen:**
1. Ga naar https://html2pdf.app
2. Maak een gratis account
3. Kopieer je API key
4. Set in Supabase:
   ```bash
   supabase secrets set HTMLPDF_API_KEY="your-api-key"
   ```

**Pricing:**
- Gratis: 100 PDFs/maand
- Pro: €9/maand voor 1000 PDFs
- Enterprise: Custom pricing

### Option B: PDFShift.io (Alternatief)

**Stappen:**
1. Ga naar https://pdfshift.io
2. Maak een account
3. Kopieer je API key
4. Set in Supabase:
   ```bash
   supabase secrets set PDFSHIFT_API_KEY="your-api-key"
   ```

**Pricing:**
- Gratis: 50 PDFs/maand
- Starter: $9/maand voor 500 PDFs
- Pro: $29/maand voor 2000 PDFs

### Option C: Browser Print Fallback (Geen setup)

Als je geen API key configureert, wordt automatisch een printbare HTML versie gegenereerd die de gebruiker kan printen naar PDF via de browser.

**Geen kosten, maar minder automatisch.**

---

## 📧 EMAIL DELIVERY SETUP

### Option 1: Gmail SMTP (Eenvoudigst voor testing)

**Stappen:**
1. Ga naar Google Account → Security
2. Enable "2-Step Verification"
3. Ga naar "App Passwords"
4. Genereer een app password voor "Mail"
5. Set in Supabase:
   ```bash
   supabase secrets set SMTP_HOST="smtp.gmail.com"
   supabase secrets set SMTP_PORT="587"
   supabase secrets set SMTP_USER="your-email@gmail.com"
   supabase secrets set SMTP_PASS="your-16-char-app-password"
   supabase secrets set SMTP_FROM="noreply@smansbv.nl"
   ```

**Limitations:**
- Max 500 emails/dag (gratis Gmail)
- Max 2000 emails/dag (Google Workspace)

### Option 2: SendGrid (Recommended voor productie)

**Stappen:**
1. Ga naar https://sendgrid.com
2. Maak een gratis account
3. Verify je domain
4. Genereer API key
5. Set in Supabase:
   ```bash
   supabase secrets set SMTP_HOST="smtp.sendgrid.net"
   supabase secrets set SMTP_PORT="587"
   supabase secrets set SMTP_USER="apikey"
   supabase secrets set SMTP_PASS="your-sendgrid-api-key"
   supabase secrets set SMTP_FROM="noreply@smansbv.nl"
   ```

**Pricing:**
- Gratis: 100 emails/dag (forever)
- Essentials: $19.95/maand voor 50K emails
- Pro: $89.95/maand voor 100K emails

### Option 3: Resend (Modern alternative)

**Stappen:**
1. Ga naar https://resend.com
2. Maak een account
3. Verify je domain
4. Genereer API key
5. Set in Supabase:
   ```bash
   supabase secrets set SMTP_HOST="smtp.resend.com"
   supabase secrets set SMTP_PORT="587"
   supabase secrets set SMTP_USER="resend"
   supabase secrets set SMTP_PASS="your-resend-api-key"
   supabase secrets set SMTP_FROM="noreply@smansbv.nl"
   ```

**Pricing:**
- Gratis: 100 emails/dag + 3K/maand
- Pro: $20/maand voor 50K emails

---

## 🧪 TESTING

### Test PDF Generation

```bash
# Via Supabase Functions UI of curl
curl -X POST 'https://your-project.supabase.co/functions/v1/generate-work-order' \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"completionId": "test-completion-id"}'
```

**Expected result:**
- ✅ PDF file created in `completion-reports` bucket
- ✅ `project_completions.pdf_url` updated
- ✅ `project_completions.status` set to 'completed'

### Test Email Sending

```bash
curl -X POST 'https://your-project.supabase.co/functions/v1/send-completion-email' \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "completionId": "test-id",
    "customerEmail": "test@example.com",
    "customerName": "Test Klant",
    "projectTitle": "Test Project",
    "monteurName": "Test Monteur",
    "completionDate": "2025-01-15",
    "customerSatisfaction": 5,
    "workPerformed": "Test werk uitgevoerd",
    "pdfUrl": "https://example.com/test.pdf"
  }'
```

**Expected result:**
- ✅ Email received by customer
- ✅ PDF attachment included
- ✅ `project_completions.email_sent_at` updated
- ✅ `project_completions.status` set to 'sent'

---

## 📱 MOBILE APP TESTING

### iOS Testing

**Prerequisites:**
- macOS computer met Xcode
- Apple Developer account ($99/jaar)
- iPhone device (iOS 13+)

**Stappen:**
1. Open project in Xcode:
   ```bash
   cd ios/App
   open App.xcworkspace
   ```

2. Connect iPhone via USB

3. Select device in Xcode

4. Build & Run (⌘R)

5. **Test checklist:**
   - [ ] Camera opens en maakt foto's
   - [ ] GPS locatie wordt correct opgehaald
   - [ ] Foto's uploaden naar Supabase Storage
   - [ ] Foto compressie werkt (check file sizes)
   - [ ] Handtekening canvas werkt
   - [ ] Project completion flow compleet
   - [ ] Offline behavior (airplane mode)

### Android Testing

**Prerequisites:**
- Android Studio
- Android device (Android 7+) of emulator

**Stappen:**
1. Open project in Android Studio:
   ```bash
   cd android
   android studio .
   ```

2. Connect device via USB (enable USB debugging)

3. Run app

4. **Test checklist:**
   - [ ] Camera opens en maakt foto's
   - [ ] GPS locatie wordt correct opgehaald
   - [ ] Foto's uploaden naar Supabase Storage
   - [ ] Foto compressie werkt (check file sizes)
   - [ ] Handtekening canvas werkt
   - [ ] Project completion flow compleet
   - [ ] Offline behavior (airplane mode)

---

## 🔍 TROUBLESHOOTING

### PDF Generation Issues

**Problem:** PDF niet gegenereerd

**Solutions:**
1. Check logs in Supabase Functions:
   ```bash
   supabase functions logs generate-work-order
   ```

2. Verify API key is set:
   ```bash
   supabase secrets list
   ```

3. Test HTML2PDF service directly:
   ```bash
   curl -X POST 'https://api.html2pdf.app/v1/generate' \
     -H 'Authorization: Bearer YOUR_API_KEY' \
     -H 'Content-Type: application/json' \
     -d '{"html": "<h1>Test</h1>"}'
   ```

4. Check bucket permissions:
   ```sql
   SELECT * FROM storage.buckets WHERE id = 'completion-reports';
   ```

### Email Delivery Issues

**Problem:** Emails not being sent

**Solutions:**
1. Check SMTP credentials:
   ```bash
   supabase secrets list
   ```

2. Test SMTP connection:
   ```bash
   # Use telnet or similar tool
   telnet smtp.gmail.com 587
   ```

3. Check function logs:
   ```bash
   supabase functions logs send-completion-email
   ```

4. Verify sender email is authorized in SMTP provider

### Photo Upload Issues

**Problem:** Photos not uploading from mobile

**Solutions:**
1. Check camera permissions in app settings

2. Check network connectivity

3. Verify bucket exists and is public:
   ```sql
   SELECT * FROM storage.buckets WHERE id = 'completion-photos';
   ```

4. Check RLS policies:
   ```sql
   SELECT * FROM storage.policies WHERE bucket_id = 'completion-photos';
   ```

5. Test upload manually:
   ```javascript
   const { data, error } = await supabase.storage
     .from('completion-photos')
     .upload('test.jpg', file)
   ```

### GPS Issues

**Problem:** GPS not working on mobile

**Solutions:**
1. Check location permissions in app settings

2. Ensure GPS is enabled on device

3. Test in open area (not indoors)

4. Check Capacitor Geolocation plugin:
   ```javascript
   import { Geolocation } from '@capacitor/geolocation'
   const position = await Geolocation.getCurrentPosition()
   console.log('Position:', position)
   ```

---

## 🚀 PRODUCTION DEPLOYMENT

### Final Checklist

- [ ] All Edge Functions deployed
- [ ] All environment secrets configured
- [ ] PDF generation tested (with real API key)
- [ ] Email delivery tested (with real SMTP)
- [ ] Storage buckets created and public
- [ ] RLS policies verified
- [ ] Mobile app tested on iOS device
- [ ] Mobile app tested on Android device
- [ ] Camera integration works
- [ ] GPS integration works
- [ ] Photo upload + compression works
- [ ] Signatures work
- [ ] Complete flow tested end-to-end
- [ ] Error handling verified
- [ ] Logs reviewed for errors

### Monitoring

**Check these regularly:**

1. **Supabase Dashboard → Functions:**
   - Check invocation count
   - Check error rate
   - Review logs for issues

2. **Supabase Dashboard → Storage:**
   - Check storage usage
   - Monitor photo sizes
   - Clean up old files if needed

3. **PDF Service Dashboard:**
   - Monitor API usage
   - Check quota limits
   - Review failed generations

4. **SMTP Provider Dashboard:**
   - Check email delivery rate
   - Review bounces/complaints
   - Monitor quota

---

## 💰 ESTIMATED MONTHLY COSTS

### Minimal Setup (Testing/Small Business)
- Supabase Free Tier: **€0**
- HTML2PDF Free Tier: **€0** (100 PDFs/maand)
- Gmail SMTP: **€0** (500 emails/dag)
- **Total: €0/maand**

### Small Business (< 1000 werkbonnen/maand)
- Supabase Pro: **$25/maand**
- HTML2PDF Pro: **€9/maand**
- SendGrid Essentials: **$20/maand**
- **Total: ~€54/maand**

### Medium Business (< 5000 werkbonnen/maand)
- Supabase Pro: **$25/maand**
- PDFShift Pro: **$29/maand**
- SendGrid Pro: **$90/maand**
- **Total: ~€144/maand**

---

## 📞 SUPPORT

**Issues?**
- Check Supabase logs: Dashboard → Functions → Logs
- Review function code: `supabase/functions/`
- Test locally: `supabase functions serve`
- Check documentation: `WERKBON_IMPLEMENTATION_COMPLETE.md`

**Need help?**
- Supabase Discord: https://discord.supabase.com
- Supabase Docs: https://supabase.com/docs
- This repo issues: Create a GitHub issue

---

## ✅ NEXT STEPS

1. **Deploy Edge Functions** (5 min)
2. **Configure PDF Service** (10 min)
3. **Configure SMTP** (10 min)
4. **Test on Device** (30 min)
5. **Go Live!** 🚀

**Tijd totaal: ~1 uur setup + testing**

