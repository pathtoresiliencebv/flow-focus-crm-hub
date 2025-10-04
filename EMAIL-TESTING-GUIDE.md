# 🧪 EMAIL SMTP/IMAP - TESTING GUIDE

**Doel:** Complete testing van de nieuwe email functionaliteit  
**Geschatte tijd:** 3-4 uur

---

## ✅ **PRE-TESTING CHECKLIST**

Voordat je begint met testen:

- [ ] Database migration is gerund in Supabase
- [ ] Edge Functions zijn deployed (test-email-connection, imap-sync, smtp-send)
- [ ] `EMAIL_ENCRYPTION_KEY` is ingesteld in Supabase Secrets
- [ ] Frontend code is deployed naar productie/staging
- [ ] Test email accounts klaar (Gmail, Outlook, etc.)

---

## 📧 **TEST 1: GMAIL ACCOUNT SETUP**

### **Setup:**
1. Ga naar Gmail en maak een App-specifiek wachtwoord:
   - Ga naar https://myaccount.google.com
   - Beveiliging → App-wachtwoorden
   - Genereer wachtwoord voor "Flow Focus CRM"

### **Test Steps:**
1. ✅ Log in op CRM
2. ✅ Ga naar "Postvak IN" (sidebar)
3. ✅ Zie je de SMTP/IMAP setup wizard?
4. ✅ Selecteer "Gmail" preset
5. ✅ Controleer: Zijn SMTP/IMAP velden vooringevuld?
   - SMTP: smtp.gmail.com:587 (TLS)
   - IMAP: imap.gmail.com:993 (SSL)
6. ✅ Voer email adres in (bijv. test@gmail.com)
7. ✅ Voer App-wachtwoord in (16 cijfers zonder spaties)
8. ✅ Klik "Test Verbinding"
9. ✅ Zie je groene success bericht?
10. ✅ Klik "Opslaan & Activeren"
11. ✅ Wordt je doorgestuurd naar email inbox?

### **Verwachte Resultaten:**
- ✅ Account wordt aangemaakt in database
- ✅ `connection_status` = 'connected'
- ✅ Passwords zijn encrypted opgeslagen
- ✅ Test email is ontvangen in Gmail inbox

### **Error Scenarios:**
**Als test faalt:**
- ❌ Verkeerd wachtwoord → Zie duidelijke error message
- ❌ 2FA niet ingeschakeld → Instructies tonen
- ❌ Verkeerde poort → Suggestie geven

---

## 📧 **TEST 2: OUTLOOK ACCOUNT SETUP**

### **Setup:**
Gebruik een Outlook/Office365 account

### **Test Steps:**
1. ✅ Klik "+ Email Account Toevoegen" (als je al Gmail hebt)
2. ✅ Selecteer "Outlook / Office 365" preset
3. ✅ Voer Outlook email adres in
4. ✅ Voer wachtwoord in (normaal wachtwoord, geen app password)
5. ✅ Test verbinding
6. ✅ Opslaan account

### **Verwachte Resultaten:**
- ✅ Account setup succesvol
- ✅ Beide accounts (Gmail + Outlook) zichtbaar in account lijst

---

## 📧 **TEST 3: EMAIL SYNCHRONISATIE (IMAP)**

### **Test Steps:**
1. ✅ Stuur een test email naar jezelf (vanuit Gmail webinterface)
2. ✅ Wacht 10 seconden
3. ✅ Klik "Sync" knop in CRM
4. ✅ Zie je de nieuwe email verschijnen in inbox?
5. ✅ Klik op de email
6. ✅ Zie je de volledige inhoud?
7. ✅ Klopt de afzender, onderwerp, datum?

### **Verwachte Resultaten:**
- ✅ Email wordt opgehaald van IMAP server
- ✅ Thread wordt aangemaakt in `email_threads` table
- ✅ Message wordt opgeslagen in `email_messages` table
- ✅ Email is leesbaar in CRM interface
- ✅ `last_sync_at` timestamp wordt geüpdatet

### **Performance:**
- ⏱️ Sync van 50 emails moet < 30 seconden duren
- ⏱️ UI moet responsive blijven tijdens sync

---

## 📧 **TEST 4: EMAIL VERZENDEN (SMTP)**

### **Test Steps:**
1. ✅ Klik "Nieuw Bericht" knop
2. ✅ Voer TO address in (test@example.com of je eigen email)
3. ✅ Voer onderwerp in: "Test Email van CRM"
4. ✅ Voer bericht in: "Dit is een test email vanuit de CRM"
5. ✅ Klik "Verzenden"
6. ✅ Zie je success bericht?
7. ✅ Check je email inbox (externe email client)
8. ✅ Is de email aangekomen?
9. ✅ Check "Verzonden" folder in CRM
10. ✅ Staat de email daar in?

### **Verwachte Resultaten:**
- ✅ Email wordt verzonden via SMTP
- ✅ Email arriveert binnen 30 seconden
- ✅ Email wordt opgeslagen in Sent folder
- ✅ Van-adres klopt
- ✅ Onderwerp klopt
- ✅ Inhoud klopt

---

## 📧 **TEST 5: EMAIL MET ATTACHMENTS**

### **Test Steps:**
1. ✅ Nieuw bericht
2. ✅ Voeg bestand toe (PDF, 1-2 MB)
3. ✅ Verzend email
4. ✅ Check ontvangen email
5. ✅ Kan je attachment openen?
6. ✅ Is het bestand niet corrupt?

### **Verwachte Resultaten:**
- ✅ Attachment wordt meegestuurd
- ✅ Bestand is intact
- ✅ Geen size limit errors (< 20MB)

---

## 📧 **TEST 6: MULTIPLE ACCOUNTS**

### **Test Steps:**
1. ✅ Voeg 3e account toe (Yahoo of custom)
2. ✅ Switch tussen accounts in UI
3. ✅ Sync elk account apart
4. ✅ Verzend email van elk account
5. ✅ Controleer dat emails van juiste account verzonden worden

### **Verwachte Resultaten:**
- ✅ Accounts zijn gescheiden
- ✅ Emails worden niet gemixed
- ✅ Correcte van-adres per account

---

## 📧 **TEST 7: ERROR HANDLING**

### **Test Scenarios:**

#### **A. Verkeerd wachtwoord:**
1. Voer verkeerd wachtwoord in
2. Test verbinding
3. ✅ Zie je duidelijke error: "Authentication failed"?
4. ✅ Krijg je suggestie om wachtwoord te controleren?

#### **B. Verkeerde server:**
1. Voer verkeerde SMTP host in (smtp.google.com ipv smtp.gmail.com)
2. Test verbinding
3. ✅ Zie je error: "Could not connect to server"?

#### **C. Firewall geblokkeerd:**
1. Test met geblokeerde poort
2. ✅ Timeout error na 30 seconden?
3. ✅ Suggestie om firewall te checken?

#### **D. Sync tijdens offline:**
1. Zet internet uit
2. Probeer te sync'en
3. ✅ Zie je error: "No internet connection"?
4. ✅ Account blijft functioneel na internet terug?

---

## 📧 **TEST 8: MOBILE RESPONSIVE**

### **Test Steps:**
1. ✅ Open CRM op mobile (iPhone/Android)
2. ✅ Navigeer naar email
3. ✅ Is setup wizard responsive?
4. ✅ Kan je email lezen?
5. ✅ Kan je email verzenden?
6. ✅ Werkt attachment upload?

### **Verwachte Resultaten:**
- ✅ UI schaalt correct naar mobile
- ✅ Geen horizontal scrolling
- ✅ Buttons zijn groot genoeg (44x44px minimum)
- ✅ Keyboard overlay interfereert niet met form

---

## 📧 **TEST 9: SECURITY**

### **Test Steps:**
1. ✅ Check database: `SELECT smtp_password FROM email_accounts`
2. ✅ Zijn passwords encrypted? (niet leesbaar plaintext?)
3. ✅ Probeer account van andere user te benaderen (als admin)
4. ✅ Werken RLS policies?
5. ✅ Check browser DevTools Network tab
6. ✅ Worden passwords NIET in network requests gestuurd?

### **Verwachte Resultaten:**
- ✅ Passwords zijn encrypted (onleesbare strings)
- ✅ RLS policies werken (users zien alleen eigen accounts)
- ✅ Geen plain text passwords in network traffic

---

## 📧 **TEST 10: PERFORMANCE**

### **Metrics te meten:**

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Account setup tijd | < 30s | | |
| Connection test tijd | < 10s | | |
| Email sync (50 emails) | < 30s | | |
| Email send tijd | < 5s | | |
| UI response tijd | < 1s | | |
| Database query tijd | < 500ms | | |

### **Load Testing:**
1. ✅ Sync 200+ emails
2. ✅ Switch snel tussen accounts
3. ✅ Verzend 10 emails in quick succession
4. ✅ UI blijft responsive?

---

## 🐛 **BUG TRACKING**

### **Template:**
```markdown
**Bug #:** [number]
**Severity:** [Critical/High/Medium/Low]
**Component:** [Database/Edge Function/Frontend]
**Description:** 
**Steps to Reproduce:**
1. 
2. 
3. 
**Expected:** 
**Actual:** 
**Screenshots:** 
**Browser:** 
**Status:** [Open/In Progress/Fixed/Closed]
```

### **Known Issues:**
1. **IMAP client is basic** - Severity: Medium
   - Only fetches headers, not full email bodies
   - No HTML parsing yet
   - Workaround: Phase 2 enhancement

2. **No automatic sync** - Severity: Low
   - Users must click "Sync" button
   - Workaround: Add cron job later

---

## ✅ **ACCEPTANCE CRITERIA**

Email migratie is succesvol als:

- [ ] ✅ Gmail account setup werkt (90%+ success rate)
- [ ] ✅ Outlook account setup werkt (90%+ success rate)
- [ ] ✅ Email sync < 30 seconden voor 50 emails
- [ ] ✅ Email verzenden < 5 seconden
- [ ] ✅ Attachments werken (send + receive)
- [ ] ✅ Multiple accounts werken
- [ ] ✅ Error handling is duidelijk
- [ ] ✅ Mobile responsive
- [ ] ✅ Security: passwords encrypted
- [ ] ✅ < 5% error rate in production
- [ ] ✅ 90%+ user satisfaction (survey)

---

## 📝 **TEST REPORT TEMPLATE**

```markdown
# Email SMTP/IMAP - Test Report

**Datum:** [date]
**Tester:** [name]
**Omgeving:** [Production/Staging]

## Summary
- **Tests uitgevoerd:** X/10
- **Geslaagd:** X
- **Gefaald:** X
- **Success Rate:** X%

## Test Results

| Test # | Test Name | Status | Notes |
|--------|-----------|--------|-------|
| 1 | Gmail Setup | ✅ PASS | |
| 2 | Outlook Setup | ✅ PASS | |
| 3 | Email Sync | ❌ FAIL | Too slow |
| ... | ... | ... | ... |

## Issues Found
[List of bugs]

## Recommendations
[Improvements to make]

## Sign-off
✅ Ready for production: [Yes/No]
Signature: ___________
```

---

**🎉 HAPPY TESTING! Report all issues voor fix. 🐛**

