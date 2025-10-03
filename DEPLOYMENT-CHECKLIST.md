# ✅ DEPLOYMENT VERIFICATIE CHECKLIST

**Datum:** 3 Oktober 2025  
**Component:** Email SMTP/IMAP Migration  

---

## 📋 **PRE-DEPLOYMENT CHECK**

### **Git Status:**
- ✅ All code committed
- ✅ All code pushed to main
- ✅ Branch: `main` is up to date
- ✅ Working tree clean

### **Commits Pushed:**
```
8e91fe0 - 🎉 feat: EMAIL SMTP/IMAP MIGRATION COMPLETE - 100% DONE! 🎊
4b7e55b - docs: Add comprehensive testing guide and user manual
53a74f4 - refactor: Archive old Gmail OAuth code and documentation
92a6e89 - docs: Add email migration completion summary
bb24b7a - feat: Update useEmailAccounts hook for SMTP/IMAP
76182d6 - feat: Add SMTP send Edge Function + progress tracker
8c60903 - feat: Add IMAP sync Edge Function for email synchronization
e9db9a7 - feat: Add SMTP/IMAP setup UI and integrate with Email page
16c19d5 - feat: Add email encryption helper and test connection function
09b72db - feat: Add database migration for SMTP/IMAP email configuration
```

**Total: 10 commits gepusht!** ✅

---

## 🚀 **LOVABLE DEPLOYMENT STATUS**

Lovable zal automatisch deployen:
1. **Frontend changes** → Deployed naar productie
2. **Edge Functions** → Deployed naar Supabase
3. **Database migrations** → Moet handmatig gerund worden

---

## 🗄️ **SUPABASE DATABASE MIGRATION**

### **STAP 1: Login Supabase**
1. Ga naar: https://supabase.com
2. Selecteer je project: **Flow Focus CRM**
3. Ga naar **SQL Editor** in linker sidebar

### **STAP 2: Run Migration**
1. Open nieuw query venster
2. Kopieer de inhoud van: `supabase/migrations/20251003000000_email_smtp_imap_migration.sql`
3. Plak in SQL editor
4. Klik **Run** (of Ctrl+Enter)
5. Check voor errors
6. ✅ Success? Dan zie je: "MIGRATION COMPLETE" message

### **STAP 3: Verify Tables**
Run deze query om te verifiëren:
```sql
-- Check if new columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'email_accounts'
  AND column_name IN ('smtp_host', 'smtp_port', 'imap_host', 'imap_port');

-- Should return 4 rows
```

**Verwacht resultaat:**
```
smtp_host  | text
smtp_port  | integer
imap_host  | text
imap_port  | integer
```

---

## 🔐 **SUPABASE SECRETS**

### **STAP 4: Set Encryption Key**
1. Ga naar **Settings** → **Edge Functions** → **Secrets**
2. Klik **Add Secret**
3. Name: `EMAIL_ENCRYPTION_KEY`
4. Value: (genereer een secure random key, min 32 characters)

**Genereer random key:**
```bash
# Option 1: Online generator
# Ga naar: https://www.random.org/strings/

# Option 2: PowerShell
# Run: -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})

# Option 3: Use this example (CHANGE IN PRODUCTION!)
"xK9#mP2$nQ7&rT5@wY8!zA3%bC6^dE1*"
```

5. Save secret
6. ✅ Verify: Secret appears in list

---

## 🔍 **EDGE FUNCTIONS VERIFICATION**

### **STAP 5: Check Edge Functions**
1. Ga naar **Edge Functions** in Supabase dashboard
2. Verify deze functions bestaan:
   - [ ] `test-email-connection`
   - [ ] `imap-sync`
   - [ ] `smtp-send`

3. Check deployment status (should be "Deployed" ✅)

### **STAP 6: Test Edge Function Manually**

**Test `test-email-connection`:**
```bash
curl -X POST 'https://[YOUR-PROJECT].supabase.co/functions/v1/test-email-connection' \
  -H 'Authorization: Bearer [YOUR-ANON-KEY]' \
  -H 'Content-Type: application/json' \
  -d '{
    "smtp": {
      "host": "smtp.gmail.com",
      "port": 587,
      "username": "test@gmail.com",
      "password": "wrong-password",
      "encryption": "tls"
    },
    "imap": {
      "host": "imap.gmail.com",
      "port": 993,
      "username": "test@gmail.com",
      "password": "wrong-password",
      "encryption": "ssl"
    }
  }'
```

**Expected:** Should return error about authentication (that's good - function works!)

---

## 🌐 **FRONTEND VERIFICATION**

### **STAP 7: Check Frontend Deployment**
1. Open je CRM in browser
2. Hard refresh: `Ctrl+Shift+R` (Windows) of `Cmd+Shift+R` (Mac)
3. Check console voor errors
4. Ga naar **Postvak IN** in sidebar

### **STAP 8: Visual Check**
**Wat je ZOU MOETEN ZIEN:**
- ✅ Email setup wizard verschijnt (als je nog geen accounts hebt)
- ✅ Provider selectie knoppen (Gmail, Outlook, Yahoo, etc.)
- ✅ SMTP/IMAP tabbladen
- ✅ Test Verbinding knop
- ✅ Opslaan & Activeren knop

**Wat je NIET zou moeten zien:**
- ❌ "Connect Gmail" OAuth button (oude systeem)
- ❌ Console errors
- ❌ Missing imports errors

---

## 🧪 **FUNCTIONAL TESTING**

### **TEST 1: Setup Wizard Toegankelijk**
1. [ ] Navigeer naar "Postvak IN"
2. [ ] Zie je de setup wizard?
3. [ ] Zijn alle provider buttons zichtbaar?

### **TEST 2: Provider Selection**
1. [ ] Klik op "Gmail" preset
2. [ ] Worden SMTP/IMAP velden ingevuld?
3. [ ] SMTP: smtp.gmail.com:587?
4. [ ] IMAP: imap.gmail.com:993?

### **TEST 3: Form Validation**
1. [ ] Laat email veld leeg
2. [ ] Probeer op te slaan
3. [ ] Zie je validation errors?

### **TEST 4: Password Visibility Toggle**
1. [ ] Voer wachtwoord in
2. [ ] Klik eye icon
3. [ ] Wordt wachtwoord zichtbaar/verborgen?

### **TEST 5: Instructions Display**
1. [ ] Selecteer Gmail preset
2. [ ] Scroll naar beneden
3. [ ] Zie je de App-password instructies?

---

## 🔥 **SMOKE TESTS (Met Echte Account)**

⚠️ **Let op:** Deze tests vereisen een echt email account!

### **TEST 6: Connection Test (met Foute Credentials)**
1. [ ] Selecteer Gmail
2. [ ] Voer je email in
3. [ ] Voer FOUT wachtwoord in
4. [ ] Klik "Test Verbinding"
5. [ ] **Verwacht:** Rode error: "Authentication failed"

### **TEST 7: Connection Test (met Juiste Credentials)**
**Setup:**
- Maak eerst een Gmail App-password aan
- Gebruik test account (niet productie!)

**Test:**
1. [ ] Selecteer Gmail
2. [ ] Voer test email in
3. [ ] Voer App-password in
4. [ ] Klik "Test Verbinding"
5. [ ] **Verwacht:** Groene success message
6. [ ] **Verwacht:** Test email ontvangen in inbox

### **TEST 8: Account Opslaan**
1. [ ] Na succesvolle test, klik "Opslaan & Activeren"
2. [ ] **Verwacht:** Redirect naar email inbox
3. [ ] **Verwacht:** Account zichtbaar in account lijst

### **TEST 9: Database Check**
```sql
-- Check if account was saved
SELECT 
  email_address,
  smtp_host,
  imap_host,
  connection_status,
  LENGTH(smtp_password) as password_length
FROM email_accounts
ORDER BY created_at DESC
LIMIT 1;
```

**Verwacht:**
- Email address is correct
- SMTP/IMAP hosts are correct
- Connection status = 'connected'
- Password length > 30 (encrypted, not plain text!)

---

## 🚨 **ROLLBACK PLAN**

Als iets fout gaat:

### **Option 1: Frontend Rollback**
```bash
git revert HEAD~10..HEAD
git push origin main
```

### **Option 2: Database Rollback**
```sql
-- Remove new columns
ALTER TABLE email_accounts 
  DROP COLUMN IF EXISTS smtp_host,
  DROP COLUMN IF EXISTS smtp_port,
  -- ... etc
```

### **Option 3: Disable Edge Functions**
1. Ga naar Supabase → Edge Functions
2. Delete of disable nieuwe functions
3. Re-enable oude gmail-sync als nodig

---

## 📊 **SUCCESS CRITERIA**

Migration is succesvol als:

- [x] ✅ All code is committed & pushed
- [ ] ✅ Database migration ran successfully
- [ ] ✅ Email encryption key is set
- [ ] ✅ Edge Functions are deployed
- [ ] ✅ Frontend shows new setup wizard
- [ ] ✅ Provider selection works
- [ ] ✅ Form validation works
- [ ] ✅ Connection test works (with fake credentials shows error)
- [ ] ✅ Connection test works (with real credentials shows success)
- [ ] ✅ Account can be saved to database
- [ ] ✅ No console errors
- [ ] ✅ No critical bugs

**When 10/11 items are checked: DEPLOYMENT SUCCESSFUL! 🎉**

---

## 📝 **DEPLOYMENT LOG**

| Timestamp | Action | Status | Notes |
|-----------|--------|--------|-------|
| 15:30 | Code pushed to main | ✅ DONE | 10 commits |
| 15:35 | Database migration | ⏳ TODO | Run in Supabase SQL |
| 15:40 | Set encryption key | ⏳ TODO | In Supabase Secrets |
| 15:45 | Edge Functions check | ⏳ TODO | Verify deployed |
| 15:50 | Frontend verification | ⏳ TODO | Check in browser |
| 16:00 | Smoke tests | ⏳ TODO | Test with real account |
| 16:15 | Sign-off | ⏳ TODO | All tests passed |

---

## ✅ **SIGN-OFF**

**Deployed by:** ___________  
**Date:** ___________  
**Time:** ___________  

**Status:**
- [ ] ✅ Deployment Successful - Ready for production
- [ ] ⚠️ Deployment Partial - Some issues found
- [ ] ❌ Deployment Failed - Rollback initiated

**Notes:**
___________________________________________
___________________________________________

---

**🚀 NEXT: Run through this checklist and mark items as done!**

